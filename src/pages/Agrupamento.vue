<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section>
        <q-select v-model="selectedColumns" :options="columnOptions" multiple emit-value map-options
          label="Select columns" outlined dense />

        <div class="q-mt-md">
          <q-btn color="primary" icon="file_download" label="Export CSV" @click="exportCSV" class="q-mr-sm" />
          <q-btn color="red" icon="picture_as_pdf" label="Export PDF" @click="exportPDF" />
        </div>
      </q-card-section>
    </q-card>

    <q-table flat bordered title="Groupings List" :rows="groupings" :columns="filteredColumns" row-key="id"
      :loading="loading" />
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import axios from 'axios';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default {
  setup() {
    const groupings = ref([]);
    const loading = ref(false);
    const columnOptions = ref([]);
    const selectedColumns = ref([]);
    const allColumns = ref([]);
    const graphqlEndpoint = 'http://127.0.0.1:5000/graphql';

    const fetchAvailableFields = async () => {
      try {
        const response = await axios.post(graphqlEndpoint, {
          query: `
          {
            __type(name: "Agrupamento") {
              fields {
                name
              }
            }
          }`
        });

        const fields = response.data.data.__type.fields.map(f => f.name);

        allColumns.value = fields.map(field => ({
          name: field,
          label: field.replace(/_/g, ' ').toUpperCase(),
          field: field,
          align: 'left',
          sortable: true
        }));

        columnOptions.value = fields.map(field => ({
          label: field.replace(/_/g, ' ').toUpperCase(),
          value: field
        }));

        selectedColumns.value = fields;

        fetchGroupings(fields);
      } catch (error) {
        console.error('Error fetching available fields:', error);
      }
    };

    const fetchGroupings = async (fields) => {
      loading.value = true;
      try {
        const query = `
        {
          agrupamentos {
            ${fields.join('\n')}
          }
        }`;

        const response = await axios.post(graphqlEndpoint, { query });

        groupings.value = response.data.data.agrupamentos;
      } catch (error) {
        console.error('Error fetching groupings:', error);
      } finally {
        loading.value = false;
      }
    };

    const exportCSV = () => {
      if (!groupings.value.length) return;

      const filteredData = groupings.value.map(row =>
        Object.fromEntries(selectedColumns.value.map(col => [col, row[col]]))
      );

      const csv = Papa.unparse(filteredData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'groupings.csv';
      link.click();
    };

    const exportPDF = () => {
      if (!groupings.value.length) return;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      doc.text('Agrupamentos', 14, 10);

      const tableData = groupings.value.map(row =>
        selectedColumns.value.map(col => row[col] || '')
      );

      const tableHeaders = selectedColumns.value.map(col =>
        col.replace(/_/g, ' ').toUpperCase()
      );

      doc.autoTable({
        head: [tableHeaders],
        body: tableData,
        margin: { top: 15 },
        didDrawPage: (data) => {
          // 🔹 Confidentiality Footer (Appears on Every Page)
          doc.setFontSize(10);
          const footerText =
            'This document is the intellectual property of Serraria Cáceres. Unauthorized disclosure, reproduction, or distribution is strictly prohibited.';

          const textWidth = doc.getStringUnitWidth(footerText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
          const xPosition = ((pageWidth - textWidth) / 2) + 10;
          const yPosition = pageHeight - 10;

          doc.text(footerText, xPosition, yPosition, { maxWidth: pageWidth - 20 });
        }
      });

      doc.save('groupings.pdf');
    };


    const filteredColumns = computed(() => {
      return allColumns.value.filter(col => selectedColumns.value.includes(col.field));
    });

    onMounted(fetchAvailableFields);

    return { groupings, columnOptions, selectedColumns, filteredColumns, loading, exportCSV, exportPDF };
  }
};
</script>
