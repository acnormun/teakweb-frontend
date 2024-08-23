<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Análise por Data</div>
      </q-card-section>

      <q-card-section>
        <!-- Filtro de Data -->
        <q-select
          v-model="selectedPeriod"
          :options="periodOptions"
          label="Filtrar por"
          outlined
          dense
        />
      </q-card-section>

      <q-card-section>
        <canvas ref="chart"></canvas>
      </q-card-section>
    </q-card>
  </q-page>
</template>



<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';
import Chart from 'chart.js/auto';
import { backupService } from '../services/backupService';
import { Agrupamento } from 'src/types/agrupamento.type';
import { format, parseISO } from 'date-fns';

// Estado reativo para os dados do backup
const backupData = ref<Agrupamento[]>([]);
const selectedPeriod = ref<string>('day');

// Opções de filtro
const periodOptions = ref([
  { label: 'Por Dia', value: 'day' },
  { label: 'Por Mês', value: 'month' },
  { label: 'Por Ano', value: 'year' },
]);

// Função para agrupar os dados por período (dia, mês ou ano)
const groupByPeriod = (data: Agrupamento[], period: string) => {
  return data.reduce((acc: Record<string, number>, item: Agrupamento) => {
    let date: string;

    if (period === 'day') {
      date = format(parseISO(item.CreateAt || ''), 'yyyy-MM-dd');
    } else if (period === 'month') {
      date = format(parseISO(item.CreateAt || ''), 'yyyy-MM');
    } else if (period === 'year') {
      date = format(parseISO(item.CreateAt || ''), 'yyyy');
    } else {
      return acc;
    }

    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});
};

// Variável para armazenar a instância do gráfico atual
let currentChart: Chart | null = null;

// Criação do gráfico
const createChart = (labels: string[], data: number[]) => {
  const ctx = (document.querySelector('canvas') as HTMLCanvasElement).getContext('2d');
  if (ctx) {
    // Se já existir um gráfico, destrua-o antes de criar um novo
    if (currentChart) {
      currentChart.destroy();
    }

    // Criação de um novo gráfico
    currentChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Número de Registros',
            backgroundColor: '#42A5F5',
            data,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }
};

// Atualiza o gráfico quando os dados ou o filtro mudam
const updateChart = () => {
  const groupedData = groupByPeriod(backupData.value, selectedPeriod.value);
  createChart(Object.keys(groupedData), Object.values(groupedData));
};

// Carrega os dados do backup ao montar o componente
onMounted(async () => {
  try {
    backupData.value = await backupService.getBackupData();
    updateChart();
  } catch (error) {
    console.error('Erro ao carregar os dados do backup:', error);
  }
});

// Observa mudanças no filtro e atualiza o gráfico
watch(selectedPeriod, updateChart);


</script>
