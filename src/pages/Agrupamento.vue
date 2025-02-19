<template>
  <q-page class="q-pa-md">
    <q-card>
      <q-card-section class="row q-gutter-md">
        <!-- Column Selection -->
        <q-select
          v-model="selectedColumns"
          :options="columnOptions"
          multiple
          emit-value
          map-options
          label="Select columns"
          outlined
          dense
          class="col-3"
        />

        <!-- Dynamic Filters for Each Column -->
        <template v-for="(filter, key) in filters" :key="key">
          <q-select
            v-if="filter.type === 'select'"
            v-model="filter.value"
            :options="filter.options"
            :label="`Filter by ${key.replace(/_/g, ' ')}`"
            outlined
            dense
            clearable
            class="col-3"
          />

          <q-input
            v-else
            v-model="filter.value"
            :label="`Search ${key.replace(/_/g, ' ')}`"
            outlined
            dense
            class="col-3"
          />
        </template>
      </q-card-section>

      <!-- 🔹 Export Buttons -->
      <q-card-section class="row q-gutter-md">
        <q-btn color="primary" icon="file_download" label="Export CSV" @click="exportCSV" class="q-mr-sm" />
        <q-btn color="red" icon="picture_as_pdf" label="Export PDF" @click="exportPDF" />
      </q-card-section>
    </q-card>

    <q-table
      flat
      bordered
      title="Groupings List"
      :rows="filteredGroupings"
      :columns="filteredColumns"
      row-key="id"
      :loading="loading"
    />
  </q-page>
</template>

<script>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import Papa from "papaparse"; // CSV Export
import jsPDF from "jspdf"; // PDF Export
import "jspdf-autotable"; // Table Plugin for jsPDF

export default {
  setup() {
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
            __type(name: "Agrupamento") {
              fields {
                name
              }
            }
          }`,
        });

        const fields = response.data.data.__type.fields.map((f) => f.name);

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
          agrupamentos {
            ${fields.join("\n")}
          }
        }`;

        const response = await axios.post(graphqlEndpoint, { query });

        groupings.value = response.data.data.agrupamentos;

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

        filters.value[key] = uniqueValues.length <= 5
          ? { type: "select", options: uniqueValues, value: null }
          : { type: "text", value: "" };
      });
    };

    // Filter Data
    const filteredGroupings = computed(() => {
      return groupings.value.filter((row) => {
        return Object.keys(filters.value).every((key) => {
          const filter = filters.value[key];

          if (filter.type === "select") {
            return filter.value ? row[key] === filter.value : true;
          } else if (filter.type === "text") {
            return filter.value ? row[key]?.toString().toLowerCase().includes(filter.value.toLowerCase()) : true;
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

    onMounted(fetchAvailableFields);

    return {
      groupings,
      columnOptions,
      selectedColumns,
      filteredColumns,
      filteredGroupings,
      filters,
      loading,
      exportCSV,
      exportPDF, // 🔹 Ensure this is returned so it's available in the template
    };
  },
};
</script>
