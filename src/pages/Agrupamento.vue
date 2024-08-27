<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Análise por Data</div>
        {{ filteredData }}
      </q-card-section>

      <q-card-section>
        <!-- Filtro por id -->
        <q-input
        :model-value="searchId"
        label="Filtrar por ID"
        type="text"
        dense
        @update:model-value="filterId"
      />
        <!-- Filtro de Data -->
        <q-select
          v-model="selectedPeriod"
          :options="periodOptions"
          label="Filtrar por"
          outlined
          dense
        />
        <!-- Filtro por status -->
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

const backupData = ref<Agrupamento[]>([]);
const searchId = ref<string | number | null>('')
const selectedPeriod = ref<string>('day');
const filteredData = ref<Agrupamento[]>([])

onMounted(async () => {
  try {
    backupData.value = await backupService.getBackupData();
    filteredData.value = backupData.value
    updateChart();
  } catch (error) {
    console.error('Erro ao carregar os dados do backup:', error);
  }
});

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

const filterId = (id: string | number | null) => {
  searchId.value = id
  if(id){
    filteredData.value = backupData.value.filter(item => item.id?.toLocaleLowerCase().includes(id?.toString().toLocaleLowerCase()))
    return;
  }
  filteredData.value = backupData.value
}

let currentChart: Chart | null = null;

const createChart = (labels: string[], data: number[]) => {
  const ctx = (document.querySelector('canvas') as HTMLCanvasElement).getContext('2d');
  if (ctx) {
    if (currentChart) {
      currentChart.destroy();
    }

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

const updateChart = () => {
  const groupedData = groupByPeriod(backupData.value, selectedPeriod.value);
  createChart(Object.keys(groupedData), Object.values(groupedData));
};


// Observa mudanças no filtro e atualiza o gráfico
watch(selectedPeriod, updateChart);


</script>
