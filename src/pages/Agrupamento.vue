<template>
  <q-page padding>
    <q-card>
      <q-card-section>
        <div class="text-h6">Agrupamentos</div>
      </q-card-section>

      <q-card-section>
        <div class="filters">
          <q-input
          :model-value="appliedFilters.id"
          class="filters__id"
          label="Filtrar por ID"
          type="text"
          dense
          @update:model-value="(e) => filter('id', e)"
          />

          <q-select clearable dense v-model="appliedFilters.status" class="filters__status" :options="statusOptions" label="Status" @update:model-value="(e) => filter('status', e)"/>

            <div>
              <q-btn color="primary" icon="cloud_upload" @click="downloadXLSX">Download xlsx</q-btn>
            </div>
        </div>

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
            <div class="col-2 q-table__title">Colunas</div>

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
      </q-card-section>

      <q-card-section>
        <canvas ref="chart"></canvas>
      </q-card-section>
    </q-card>
  </q-page>
</template>



<script lang="ts" setup>
import { onMounted, ref, Ref } from 'vue';
import { backupService } from '../services/backupService';
import { Agrupamento } from 'src/types/agrupamento.type';
import { formatDate } from 'src/utils/formatDate';
import { exportToExcel } from 'src/utils/exportExcel';
const backupData = ref<Agrupamento[]>([]);
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
    sortable: true,
    format: (val: string) => formatDate(val)
  }
]

const visibleColumns = ref(['id', 'group'])

const statusOptions = ['aberto', 'fechado', 'vendido']

const appliedFilters: Ref<Partial<Agrupamento>> = ref({
  id: '',
  status: ''
})

onMounted(async () => {
  try {
    backupData.value = await backupService.getBackupData();
    filteredData.value = backupData.value
  } catch (error) {
    console.error('Erro ao carregar os dados do backup:', error);
  }
});


const filter = (type: keyof typeof backupData.value[0], value: string | number | null) => {
  appliedFilters.value[type] = value ? value.toString() : '';
  filteredData.value = backupData.value.filter((item: Agrupamento) =>
    Object.entries(appliedFilters.value).every(([key, filterValue]) =>
      filterValue
        ? item[key as keyof typeof item]?.toString().toLocaleLowerCase().includes(filterValue.toLocaleLowerCase())
        : true
    )
  );

}

const downloadXLSX = () => {
  if(filteredData.value.length > 0){
    exportToExcel(filteredData.value)
  }
}

</script>

<style lang="scss">
.filters{
  display: flex;
  flex-direction: row;
  gap: 1rem;

  &__id{
    min-width: 30vw;
  }

  &__status{
    min-width: 20vw;
  }

}
</style>
