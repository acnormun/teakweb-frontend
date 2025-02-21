<template>
  <q-layout view="hHh lpR fF">
    <q-page-container>
      <q-page class="q-pa-md">
        <q-card>
          <q-card-section class="row q-col-gutter-md">
            <q-select v-model="selectedColumns" :options="columnOptions" multiple emit-value map-options
              label="Select columns" outlined dense class="col-10" />
            <template v-for="(filter, key) in filters" :key="key">
              <!-- 🔹 Multi-Select Dropdown (Unchanged) -->
              <q-select
                v-if="filter.type === 'select'"
                v-model="filter.value"
                :options="filter.options"
                :label="`Filter by ${key.replace(/_/g, ' ')}`"
                outlined
                multiple
                dense
                class="col-5"
              />

              <!-- 🔹 Date Range Picker (Single Input, Shows Selected Range) -->
              <div v-else-if="filter.type === 'date'" class="col-5 column q-gutter-xs">
                <q-item-label class="q-mb-xs text-grey-6">{{ key.replace(/_/g, ' ') }}</q-item-label>

                <q-input
                  v-model="filter.dateRangeText"
                  outlined
                  dense
                  readonly
                  label="Select Date Range"
                  class="cursor-pointer"
                  @click="$refs[`datePopup-${key}`].show()"
                >
                  <template v-slot:append>
                    <q-icon name="event" class="cursor-pointer" @click.stop="$refs[`datePopup-${key}`].show()" />
                  </template>
                </q-input>

                <q-popup-proxy ref="datePopup" cover transition-show="scale" transition-hide="scale">
                  <q-date
                    v-model="filter.dateRange"
                    range
                    mask="YYYY-MM-DD"
                    @update:model-value="updateDateRange(key)"
                  />
                </q-popup-proxy>
              </div>

              <!-- 🔹 Standard Text Search (Unchanged) -->
              <q-input
                v-else
                v-model="filter.value"
                :label="`Search ${key.replace(/_/g, ' ')}`"
                outlined
                dense
                class="col-5"
              />
            </template>
          </q-card-section>


          <!-- 🔹 Export Buttons -->
          <q-card-section class="row q-gutter-md">
            <q-btn color="primary" icon="file_download" label="Export CSV" @click="exportCSV" class="q-mr-sm" />
            <q-btn color="red" icon="picture_as_pdf" label="Export PDF" @click="exportPDF" />
          </q-card-section>
        </q-card>

        <q-table flat bordered :title='stringUtils.capitalizeFirstLetter(schemaName)' :rows="filteredGroupings" :columns="filteredColumns" row-key="id"
          :loading="loading" />

        <!-- 🔹 Display Total Count of Filtered Items -->
        <q-card-section class="text-right q-mt-md">
          <q-banner rounded class="bg-grey-2 text-dark">
            <q-icon name="list" size="20px" class="q-mr-sm" />
            <strong>Total Items:</strong> {{ filteredGroupings.length }}
          </q-banner>
        </q-card-section>
      </q-page>
    </q-page-container>
  </q-layout>
</template>


<script setup>
import { ref, computed, onMounted, watch } from "vue";
import axios from "axios";
import Papa from "papaparse"; // CSV Export
import jsPDF from "jspdf"; // PDF Export
import "jspdf-autotable"; // Table Plugin for jsPDF
import stringUtils from "src/utils/strTools";

// ✅ Receive `schemaName` from route props
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
const graphqlEndpoint = "http://127.0.0.1:5000/graphql";

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

    // Convert fields into Quasar table format
    allColumns.value = fields.map((field) => ({
      name: field,
      label: field.replace(/_/g, " ").toUpperCase(),
      field: field,
      align: "left",
      sortable: true,
    }));

    columnOptions.value = fields.map((field) => ({
      label: field.replace(/_/g, " ").toUpperCase(),
      value: field,
    }));

    selectedColumns.value = fields;

    fetchGroupings(fields);
  } catch (error) {
    console.error("Error fetching available fields:", error);
  }
};

// Fetch Data
const fetchGroupings = async (fields) => {
  loading.value = true;
  try {
    const query = `
    {
      ${props.schemaName} {
        ${fields.join("\n")}
      }
    }`;

    const response = await axios.post(graphqlEndpoint, { query });

    groupings.value = response.data?.data?.[props.schemaName] || [];

    generateFilters();
  } catch (error) {
    console.error("Error fetching groupings:", error);
  } finally {
    loading.value = false;
  }
};

// Generate Filters Dynamically
const generateFilters = () => {
  const firstRow = groupings.value[0] || {};
  Object.keys(firstRow).forEach((key) => {
    const uniqueValues = [...new Set(groupings.value.map((item) => item[key]))];

    if (key.toLowerCase().includes("date") || key.toLowerCase().includes("created_at") || key.toLowerCase().includes("updated_at")) {
      filters.value[key] = {
        type: "date",
        dateRange: null, // Stores the selected date range
        dateRangeText: "Select Date Range", // ✅ Default placeholder
      };
    } else {
      filters.value[key] = uniqueValues.length <= 5
        ? { type: "select", options: uniqueValues, value: [] }
        : { type: "text", value: "" };
    }
  });
};

const updateDateRange = (key) => {
  const filter = filters.value[key];
  if (filter.dateRange && filter.dateRange.from && filter.dateRange.to) {
    filter.dateRangeText = `${filter.dateRange.from} - ${filter.dateRange.to}`;
  } else {
    filter.dateRangeText = "Select Date Range";
  }
};



// Filter Data
const filteredGroupings = computed(() => {
  return groupings.value.filter((row) => {
    return Object.keys(filters.value).every((key) => {
      const filter = filters.value[key];

      if (filter.type === "select") {
        return filter.value.length === 0 || filter.value.includes(row[key]); // ✅ Multi-select filtering
      } else if (filter.type === "text") {
        return filter.value ? row[key]?.toString().toLowerCase().includes(filter.value.toLowerCase()) : true;
      } else if (filter.type === "date") {
        if (!filter.dateRange || !filter.dateRange.from || !filter.dateRange.to) return true;

        const rowDate = new Date(row[key]);
        const startDate = filter.dateRange.from ? new Date(filter.dateRange.from) : null;
        const endDate = filter.dateRange.to ? new Date(filter.dateRange.to) : null;

        return (!startDate || rowDate >= startDate) && (!endDate || rowDate <= endDate); // ✅ Date range filtering
      }

      return true;
    });
  });
});


const filteredColumns = computed(() => {
  return allColumns.value.filter((col) => selectedColumns.value.includes(col.field));
});

// Export to CSV
const exportCSV = () => {
  if (!filteredGroupings.value.length) return;

  const filteredData = filteredGroupings.value.map((row) =>
    Object.fromEntries(selectedColumns.value.map((col) => [col, row[col]]))
  );

  const csv = Papa.unparse(filteredData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "groupings.csv";
  link.click();
};

// Export to PDF
const exportPDF = () => {
  if (!filteredGroupings.value.length) return;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  doc.text("Groupings List", 14, 10);

  const tableData = filteredGroupings.value.map((row) =>
    selectedColumns.value.map((col) => row[col] || "")
  );

  const tableHeaders = selectedColumns.value.map((col) =>
    col.replace(/_/g, " ").toUpperCase()
  );

  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    margin: { top: 15 },
    didDrawPage: (data) => {
      doc.setFontSize(10);
      const footerText =
        "This document is the intellectual property of Serraria Cáceres. Unauthorized disclosure, reproduction, or distribution is strictly prohibited.";

      const textWidth =
        doc.getStringUnitWidth(footerText) * doc.internal.getFontSize() / doc.internal.scaleFactor;
      const xPosition = (pageWidth - textWidth) / 2;
      const yPosition = pageHeight - 10;

      doc.text(footerText, xPosition, yPosition, { maxWidth: pageWidth - 20 });
    },
  });

  doc.save("groupings.pdf");
};

// Watch for prop changes
watch(() => props.schemaName, () => {
  fetchAvailableFields();
});

onMounted(fetchAvailableFields);
</script>
