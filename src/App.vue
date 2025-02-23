<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';

defineOptions({
  name: 'App'
});

// Chamar a API no carregamento do app
const updateSchema = async () => {
  try {
    const response = await fetch('http://127.0.0.1:5000/update-schema', {
      method: 'POST'
    });
    if (!response.ok) {
      console.error('Erro ao atualizar o schema:', response.statusText);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
};

// Executa a função assim que o app carregar
onMounted(updateSchema);
</script>
