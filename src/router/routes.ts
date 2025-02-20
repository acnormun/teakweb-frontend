import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import axios from 'axios';

const graphqlEndpoint = 'http://127.0.0.1:5000/graphql';

// 🔹 Function to Fetch Available Schemas from GraphQL API
async function fetchSchemas(): Promise<string[]> {
  try {
    const response = await axios.post(graphqlEndpoint, {
      query: `{
        schemas
      }`,
    });

    return response.data?.data?.schemas || [];
  } catch (error) {
    console.error("Error fetching schemas:", error);
    return [];
  }
}

// 🔹 Base Routes (Inside `MainLayout.vue`)
const baseRoutes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'), // ✅ Ensures sidebar is always present
    children: [
      { path: '', name: 'Home', component: () => import('pages/IndexPage.vue') }
    ],
  },
  {
    path: '/:catchAll(.*)*',
    name: 'Not Found',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

// 🔹 Function to Get All Routes (Including Dynamic Schema-Based Ones)
async function getRoutes(): Promise<RouteRecordRaw[]> {
  const schemas = await fetchSchemas();

  const dynamicRoutes: RouteRecordRaw[] = schemas.map((schema) => ({
    path: `/${schema}`,
    name: schema.charAt(0).toUpperCase() + schema.slice(1),
    component: () => import('pages/Agrupamento.vue'),
    props: (route) => ({ schemaName: schema }), // ✅ Pass schema name as a prop
  }));

  // ✅ Add dynamic routes inside `MainLayout.vue`
  baseRoutes[0].children!.push(...dynamicRoutes);

  return baseRoutes;
}

// 🔹 Create Vue Router and Ensure Dynamic Routes Are Loaded
const routerPromise = getRoutes().then((routes) => {
  return createRouter({
    history: createWebHistory(),
    routes,
  });
});

export default routerPromise;
