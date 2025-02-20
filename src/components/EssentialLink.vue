<template>
  <q-item clickable v-ripple :to="link">
    <q-item-section avatar>
      <q-icon :name="icon" />
    </q-item-section>

    <q-item-section>
      <q-item-label>{{ title }}</q-item-label>
      <q-item-label caption>{{ caption }}</q-item-label>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
// ✅ Define the props interface and export it
export interface EssentialLinkProps {
  title: string;
  caption: string;
  icon: string;
  link: string;
}

// ✅ Define the props using `defineProps`
defineProps<EssentialLinkProps>();
</script>
