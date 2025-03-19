<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn
          v-if="isAuthenticated"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title>
          Teakweb
        </q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-if="isAuthenticated"
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header> Navigation </q-item-label>
        <EssentialLink v-for="link in filteredLinks" :key="link.title" v-bind="link" />
      </q-list>
    </q-drawer>

    <!-- ✅ Ensure child pages (like Agrupamento.vue) load inside router-view -->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import EssentialLink, { EssentialLinkProps } from 'components/EssentialLink.vue';
import { useAuthStore } from '../stores/auth'; // Make sure to create this store

defineOptions({
  name: 'MainLayout'
});

const router = useRouter();
const authStore = useAuthStore();
const leftDrawerOpen = ref(false);

const isAuthenticated = computed(() => !!authStore.token);

// 🔹 Generate dynamic links from router routes
const linksList = computed((): EssentialLinkProps[] => {
  const links: EssentialLinkProps[] = [
    {
      title: 'Home',
      caption: 'Go to home page',
      icon: 'home',
      link: '/' // ✅ Always include home link
    }
  ];

  const dynamicLinks = router.getRoutes()
    .filter(route => route.path !== '/' && route.path !== '/:catchAll(.*)*') // Exclude Home & 404 routes
    .map(route => ({
      title: String(route.name ?? route.path.replace('/', '')), // 🔹 Ensure title is always a string
      caption: route.path.replace('/', ''), // Display path name
      icon: 'workspaces', // Default icon, change as needed
      link: route.path.startsWith('/') ? route.path : `/${route.path}` // ✅ Ensure one leading slash
    }));

  return [...links, ...dynamicLinks]; // ✅ Always include home at the top
});

// Only show filtered links if authenticated
const filteredLinks = computed(() => {
  if (!isAuthenticated.value) return [];
  return linksList.value.filter(link => link.link !== '');
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
</script>


