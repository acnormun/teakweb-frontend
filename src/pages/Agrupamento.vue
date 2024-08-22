<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<template>
  <div v-if="backupData">
    <pre>{{ backupData }}</pre>
  </div>
  <div v-else>
    Carregando dados do backup...
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import {backupService} from '../services/backupService'
import { Agrupamento } from 'src/types/agrupamento.type';

const backupData = ref<Agrupamento[]>([]);

onMounted(async () => {
  try {
    backupData.value = await backupService.getBackupData();
  } catch (error) {
    console.error('Erro ao carregar os dados do backup:', error);
  }
});
</script>
