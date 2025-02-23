<template>
  <div class="chart-container">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

// Registra os módulos necessários do Chart.js e o plugin DataLabels
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

// Função para renderizar o gráfico
const renderChart = () => {
  if (canvas.value) {
    chart.value = new Chart(canvas.value, {
      type: props.chartType,
      data: props.chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          // Exibe labels dentro do gráfico
          datalabels: {
            color: '#fff',
            anchor: 'center',
            align: 'center',
            font: {
              weight: 'bold'
            },
            formatter: (value, context) => {
              let label = context.chart.data.labels[context.dataIndex];

              // Corrige problema de `[Object object]`
              if (typeof label === 'object') {
                label = JSON.stringify(label);
              }

              const dataArr = context.dataset.data;
              const sum = dataArr.reduce((a, b) => a + b, 0);
              if (!sum || isNaN(sum)) return `${label}: 0%`; // Evita NaN%

              // Verifica se é um gráfico de barras e pega `y`, senão usa `value`
              const parsedValue =
                props.chartType.includes('bar') && typeof context.parsed === 'object'
                  ? context.parsed.y
                  : value;

              const percentage = ((parsedValue / sum) * 100).toFixed(2);
              return `${label}: ${percentage}%`;
            }
          },
          // Configuração do tooltip
          tooltip: {
            callbacks: {
              label: (context) => {
                let label = context.label || '';

                // Corrige problema de `[Object object]`
                if (typeof label === 'object') {
                  label = JSON.stringify(label);
                }

                const dataArr = context.chart.data.datasets[0].data;
                const sum = dataArr.reduce((a, b) => a + b, 0);
                if (!sum || isNaN(sum)) return `${label}: 0 (0%)`; // Evita NaN%

                // Verifica se é um gráfico de barras e pega `y`, senão usa `parsed`
                const parsedValue =
                  props.chartType.includes('bar') && typeof context.parsed === 'object'
                    ? context.parsed.y
                    : context.parsed;

                const percentage = ((parsedValue / sum) * 100).toFixed(2);
                return `${label}: ${parsedValue} (${percentage}%)`;
              }
            }
          }
        },
        ...props.chartOptions
      }
    });
  }
};

// Atualiza os dados do gráfico quando há mudanças
const updateChart = () => {
  if (chart.value) {
    chart.value.data = props.chartData;
    chart.value.update();
  }
};

onMounted(() => {
  renderChart();
});

// Observa mudanças nos dados do gráfico e o atualiza automaticamente
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
