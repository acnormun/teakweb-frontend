<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Análise por Data</div>

      </q-card-section>

      <q-card-section>
        <q-input
        :model-value="searchId"
        label="Filtrar por ID"
        type="text"
        dense
        @update:model-value="filterId"
        />

        <div class="q-pa-md">
          <q-table
            row-key="id"
            :rows="filteredData"
            :columns="columns"
            v-model:pagination="pagination"
            :rows-per-page-options="[0]"
            v-model:selected="selected"
            :visible-columns="visibleColumns"
            style="height: 400px"
            flat bordered
            virtual-scroll
            selection="multiple"
            binary-state-sort
            no-data-label="I didn't find anything for you"
          >
          <template v-slot:top="props">
            <div class="col-2 q-table__title">Treats</div>

            <q-space />

            <div v-if="$q.screen.gt.xs" class="col">
              <q-toggle v-for="item in columns" :key="item.name" v-model="visibleColumns" :val="item.name" :label="item.label" />
            </div>
            <q-select
              v-else
              v-model="visibleColumns"
              multiple
              borderless
              dense
              options-dense
              :display-value="$q.lang.table.columns"
              emit-value
              map-options
              :options="columns"
              option-value="name"
              style="min-width: 150px"
            />

            <q-btn
              flat round dense
              :icon="props.inFullscreen ? 'fullscreen_exit' : 'fullscreen'"
              @click="props.toggleFullscreen"
              class="q-ml-md"
            />
          </template>
        </q-table>
        </div>
        {{ filteredData }}
      </q-card-section>

      <q-card-section>
        <canvas ref="chart"></canvas>
      </q-card-section>
    </q-card>
  </q-page>
</template>



<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { backupService } from '../services/backupService';
import { Agrupamento } from 'src/types/agrupamento.type';
const backupData = ref<Agrupamento[]>([]);
const searchId = ref<string | number | null>('')
const filteredData = ref<Agrupamento[]>([])
const  pagination= ref({ rowsPerPage: 1000 })
const selected = ref([])

const columns = [
  {
    name: 'id',
    label: '#ID',
    field: (row: Agrupamento) => row.id
  },
  {
    name: 'group',
    label: 'Agrupamento',
    field: (row: Agrupamento) => row.agrupamento,
    sortable: true
  },
  {
    name: 'status',
    label: 'Status',
    field: (row: Agrupamento) => row.status,
  },
  {
    name: 'createdAt',
    label: 'Criado em',
    field: (row: Agrupamento) => row.CreateAt,
  }
]

const visibleColumns = ref(['id', 'group'])

onMounted(async () => {
  try {
    backupData.value = await backupService.getBackupData();
    filteredData.value = backupData.value
  } catch (error) {
    console.error('Erro ao carregar os dados do backup:', error);
  }
});


const filterId = (id: string | number | null) => {
  searchId.value = id
  if(id){
    filteredData.value = backupData.value.filter(item => item.id?.toLocaleLowerCase().includes(id?.toString().toLocaleLowerCase()))
  }else {
    filteredData.value = backupData.value
  }

}

</script>
