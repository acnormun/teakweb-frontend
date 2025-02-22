<template>
  <div class="chart-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables, ChartDataLabels);

const props = defineProps({
  chartType: {
    type: String,
    default: 'pie'  // ou 'doughnut', se preferir
  },
  chartData: {
    type: Object,
    required: true
  },
  chartOptions: {
    type: Object,
    default: () => ({})
  }
});

const canvas = ref(null);
const chart = ref(null);

const renderChart = () => {
  if (canvas.value) {
    chart.value = new Chart(canvas.value, {
      type: props.chartType,
      data: props.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          // Desabilita a exibição das labels diretamente no gráfico
          datalabels: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const dataArr = context.chart.data.datasets[0].data;
                const sum = dataArr.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / sum) * 100).toFixed(2);
                return `${label}: ${context.parsed} (${percentage}%)`;
              }
            }
          }
        },
        ...props.chartOptions
      }
    });
  }
};

const updateChart = () => {
  if (chart.value) {
    chart.value.data = props.chartData;
    chart.value.update();
  }
};

onMounted(() => {
  renderChart();
});

watch(() => props.chartData, () => {
  updateChart();
}, { deep: true });
</script>

<style scoped>
.chart-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
