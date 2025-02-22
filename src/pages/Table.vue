<template>
  <q-layout view="hHh lpR fF">
    <q-page-container>
      <q-page class="q-pa-md">
        <q-card>
          <q-card-section class="row q-col-gutter-md">
            <q-select v-model="selectedColumns" :options="columnOptions" multiple emit-value map-options
              label="Select columns" outlined dense class="col-10" />

            <!-- Container para todos os filtros -->
            <div class="filter-container">
              <!-- Filtros que não são de data -->
              <div v-for="key in nonDateFilterKeys" :key="key" class="filter-block">
                <q-select v-if="filters[key].type === 'select'" v-model="filters[key].value"
                  :options="filters[key].options" :label="`Filter by ${key.replace(/_/g, ' ')}`" outlined multiple
                  dense />
                <q-input v-else-if="filters[key].type === 'text'" v-model="filters[key].value"
                  :label="`Search ${key.replace(/_/g, ' ')}`" outlined dense />
              </div>

              <!-- Filtros de data -->
              <div v-for="key in dateFilterKeys" :key="key" class="filter-block">
                <q-item-label class="q-mb-xs text-grey-6">
                  {{ key.replace(/_/g, ' ') }}
                </q-item-label>
                <q-input v-model="filters[key].dateRangeText" outlined dense readonly label="Select Date Range"
                  class="cursor-pointer" @click="$refs[`datePopup-${key}`].show()">
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer" @click.stop="$refs[`datePopup-${key}`].show()" />
                  </template>
                </q-input>
                <q-popup-proxy :ref="`datePopup-${key}`" cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="filters[key].dateRange" range mask="YYYY-MM-DD"
                    @update:model-value="updateDateRange(key)" />
                </q-popup-proxy>
              </div>
            </div>
          </q-card-section>

          <q-card-section class="row q-gutter-md">
            <q-btn color="primary" icon="file_download" label="Export CSV" @click="exportCSV" class="q-mr-sm" />
            <q-btn color="red" icon="picture_as_pdf" label="Export PDF" @click="exportPDF" />
          </q-card-section>
        </q-card>

        <q-table flat bordered :title="stringUtils.capitalizeFirstLetter(schemaName)" :rows="filteredGroupings"
          :columns="filteredColumns" row-key="id" :loading="loading" />

        <q-card-section class="text-right q-mt-md">
          <q-banner rounded class="bg-grey-2 text-dark">
            <q-icon name="list" size="20px" class="q-mr-sm" />
            <strong>Total Items:</strong> {{ filteredGroupings.length }}
          </q-banner>
        </q-card-section>
        <!-- Seção para o gráfico -->
        <q-card class="q-mt-md">
          <q-card-section>
            <q-select v-model="selectedChartColumn" :options="chartColumnOptions"
              label="Selecione a coluna para o gráfico" outlined dense />
          </q-card-section>
          <q-card-section style="height: 400px;">
            <ChartComponent v-if="selectedChartColumn" :key="selectedChartColumn" :chart-type="computedChartType"
              :chart-data="computedChartData" :chart-options="chartOptions" />
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import axios from 'axios';
import Papa from 'papaparse'; // CSV Export
import jsPDF from 'jspdf'; // PDF Export
import 'jspdf-autotable'; // Table Plugin for jsPDF
import stringUtils from 'src/utils/strTools';
import ChartComponent from '../components/Chart.vue';

const props = defineProps({
  schemaName: {
    type: String,
    required: true
  }
});

const groupings = ref([]);
const loading = ref(false);
const columnOptions = ref([]);
const selectedColumns = ref([]);
const allColumns = ref([]);
const filters = ref({});
const graphqlEndpoint = 'http://127.0.0.1:5000/graphql';



// Variáveis para o gráfico
const selectedChartColumn = ref(null);
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false
};
const chartColumnOptions = computed(() => columnOptions.value);

// Propriedades computadas para o ChartComponent
const computedChartData = computed(() => prepareChartData(selectedChartColumn.value));
const computedChartType = computed(() => determineChartType(selectedChartColumn.value));

// Função para determinar o tipo de gráfico com base na coluna
const determineChartType = (column) => {
  // Normaliza a coluna, caso ela venha como objeto { value: 'nome' }
  const colName = (typeof column === 'object' && column.value) ? column.value : column;
  if (!colName || !groupings.value.length) return "bar";

  const sampleValue = groupings.value[0][colName];
  const fullDateRegex = /^\d{4}-\d{2}-\d{2}/;
  const monthYearRegex = /^\d{2}-\d{4}$/;

  if (typeof sampleValue === "number") return "bar";
  if (
    typeof sampleValue === "string" &&
    (fullDateRegex.test(sampleValue) || monthYearRegex.test(sampleValue))
  ) {
    return "bar";
  }

  return "pie";
};
// Fetch Available Fields
const fetchAvailableFields = async () => {
  try {
    const response = await axios.post(graphqlEndpoint, {
      query: `
      {
        __type(name: "${props.schemaName}") {
          fields {
            name
          }
        }
      }`,
    });

    const fields = response.data?.data?.__type?.fields?.map((f) => f.name) || [];

    allColumns.value = fields.map((field) => ({
      name: field,
      label: field.replace(/_/g, ' ').toUpperCase(),
      field: field,
      align: 'left',
      sortable: true,
    }));

    columnOptions.value = fields.map((field) => ({
      label: field.replace(/_/g, ' ').toUpperCase(),
      value: field,
    }));

    selectedColumns.value = fields;

    fetchGroupings(fields);
  } catch (error) {
    console.error('Error fetching available fields:', error);
  }
};

// Fetch Data
const fetchGroupings = async (fields) => {
  loading.value = true;
  try {
    const query = `
    {
      ${props.schemaName} {
        ${fields.join('\n')}
      }
    }`;

    const response = await axios.post(graphqlEndpoint, { query });
    groupings.value = response.data?.data?.[props.schemaName] || [];
    generateFilters();
  } catch (error) {
    console.error('Error fetching groupings:', error);
  } finally {
    loading.value = false;
  }
};

// Generate Filters Dynamically
const generateFilters = () => {
  const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!groupings.value.length) return;

  const keys = Object.keys(groupings.value[0]);
  keys.forEach((key) => {
    const isDateField = groupings.value.some((row) => {
      const value = row[key];
      return typeof value === 'string' && dateRegex.test(value);
    });

    if (isDateField) {
      filters.value[key] = {
        type: 'date',
        dateRange: null,
        dateRangeText: 'Select Date Range',
      };
    } else {
      const uniqueValues = [
        ...new Set(groupings.value.map((item) => item[key])),
      ];
      filters.value[key] =
        uniqueValues.length <= 5
          ? { type: 'select', options: uniqueValues, value: [] }
          : { type: 'text', value: '' };
    }
  });
};

const updateDateRange = (key) => {
  const filter = filters.value[key];
  if (filter.dateRange && filter.dateRange.from && filter.dateRange.to) {
    filter.dateRangeText = `${filter.dateRange.from} - ${filter.dateRange.to}`;
  } else {
    filter.dateRangeText = 'Select Date Range';
  }
};

const filteredGroupings = computed(() => {
  return groupings.value.filter((row) => {
    return Object.keys(filters.value).every((key) => {
      const filter = filters.value[key];

      if (filter.type === 'select') {
        return filter.value.length === 0 || filter.value.includes(row[key]);
      } else if (filter.type === 'text') {
        return filter.value
          ? row[key]?.toString().toLowerCase().includes(filter.value.toLowerCase())
          : true;
      } else if (filter.type === 'date') {
        if (!filter.dateRange || !filter.dateRange.from || !filter.dateRange.to)
          return true;

        const rowDate = new Date(row[key]);
        const startDate = filter.dateRange.from ? new Date(filter.dateRange.from) : null;
        const endDate = filter.dateRange.to ? new Date(filter.dateRange.to) : null;

        return (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate);
      }
      return true;
    });
  });
});

const filteredColumns = computed(() => {
  return allColumns.value.filter((col) => selectedColumns.value.includes(col.field));
});

// Propriedades computadas para separar filtros
const nonDateFilterKeys = computed(() => {
  return Object.keys(filters.value).filter(
    (key) => filters.value[key].type !== 'date'
  );
});

const dateFilterKeys = computed(() => {
  return Object.keys(filters.value).filter(
    (key) => filters.value[key].type === 'date'
  );
});

const exportCSV = () => {
  if (!filteredGroupings.value.length) return;

  const filteredData = filteredGroupings.value.map((row) =>
    Object.fromEntries(selectedColumns.value.map((col) => [col, row[col]]))
  );

  const csv = Papa.unparse(filteredData);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'groupings.csv';
  link.click();
};

const exportPDF = () => {
  if (!filteredGroupings.value.length) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  doc.text('Groupings List', 14, 10);

  const tableData = filteredGroupings.value.map((row) =>
    selectedColumns.value.map((col) => row[col] || '')
  );

  const tableHeaders = selectedColumns.value.map((col) =>
    col.replace(/_/g, ' ').toUpperCase()
  );

  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    margin: { top: 15 },
    didDrawPage: (data) => {
      doc.setFontSize(10);
      const footerText =
        'This document is the intellectual property of Serraria Cáceres. Unauthorized disclosure, reproduction, or distribution is strictly prohibited.';

      const textWidth =
        doc.getStringUnitWidth(footerText) *
        doc.internal.getFontSize() /
        doc.internal.scaleFactor;
      const xPosition = (pageWidth - textWidth) / 2;
      const yPosition = pageHeight - 10;

      doc.text(footerText, xPosition, yPosition, { maxWidth: pageWidth - 20 });
    },
  });

  doc.save('groupings.pdf');
};

const prepareChartData = (column) => {
  const colName = (typeof column === 'object' && column.value) ? column.value : column;
  if (!colName) return { labels: [], datasets: [] };

  const counts = {};
  const data = filteredGroupings.value;

  // Verifica se a coluna possui um formato de data
  const sampleValue = data[0] ? data[0][colName] : null;
  const fullDateRegex = /^\d{4}-\d{2}-\d{2}/;
  const monthYearRegex = /^\d{2}-\d{4}$/;
  const isDateColumn = typeof sampleValue === 'string' && (fullDateRegex.test(sampleValue) || monthYearRegex.test(sampleValue));
  console.log(JSON.stringify(isDateColumn))

  if (isDateColumn) {
    // Se o valor estiver no formato "MM-YYYY", agrupa diretamente pelo valor
    if (monthYearRegex.test(sampleValue)) {
      data.forEach(row => {
        const label = row[colName] ? row[colName] : 'Desconhecido';
        counts[label] = (counts[label] || 0) + 1;
      });
    } else if (fullDateRegex.test(sampleValue)) {
      // Para datas no formato "YYYY-MM-DD", converte para objetos Date e decide o agrupamento
      const dates = data
        .map(row => new Date(row[colName]))
        .filter(date => !isNaN(date));
      if (dates.length === 0) return { labels: [], datasets: [] };

      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));

      // Se todas as datas estiverem no mesmo mês, agrupa por dia; caso contrário, agrupa por mês (ex.: "YYYY-MM")
      const groupByDay = (minDate.getFullYear() === maxDate.getFullYear() &&
                          minDate.getMonth() === maxDate.getMonth());

      data.forEach(row => {
        const dateObj = new Date(row[colName]);
        if (isNaN(dateObj)) return;
        let label;
        if (groupByDay) {
          // Agrupa por dia – formato "YYYY-MM-DD"
          label = dateObj.toISOString().substring(0, 10);
        } else {
          // Agrupa por mês – formato "YYYY-MM"
          label = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
        }
        counts[label] = (counts[label] || 0) + 1;
      });
    }
  } else {
    // Para colunas que não são data, agrupa os valores normalmente
    data.forEach(row => {
      const val = (row[colName] === null || row[colName] === undefined) ? 'Desconhecido' : row[colName];
      counts[val] = (counts[val] || 0) + 1;
    });
  }

  return {
    labels: Object.keys(counts),
    datasets: [
      {
        label: `Distribuição de ${colName}`,
        backgroundColor: ['#f87979', '#a1cfff', '#caffbf'],
        data: Object.values(counts)
      }
    ]
  };
};


watch(() => props.schemaName, () => {
  fetchAvailableFields();
});

onMounted(fetchAvailableFields);
</script>

<style scoped>
.filter-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.filter-block {
  width: 300px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid #eee;
  padding: 8px;
  box-sizing: border-box;
}
</style>
