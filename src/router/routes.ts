import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import axios from "axios";

const graphqlEndpoint = "http://127.0.0.1:5000/graphql";

// 🔹 Fetch Available Schemas from GraphQL API
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
    path: "/",
    component: () => import("layouts/MainLayout.vue"),
    children: [
      { path: "", name: "Home", component: () => import("pages/IndexPage.vue") },
    ],
  },
  {
    path: "/:catchAll(.*)*",
    name: "Not Found",
    component: () => import("pages/ErrorNotFound.vue"),
  },
];

// 🔹 Function to Get All Routes (Including Dynamic Schema-Based Ones)
async function getRoutes(): Promise<RouteRecordRaw[]> {
  const schemas = await fetchSchemas();

  const dynamicRoutes: RouteRecordRaw[] = schemas.map((schema) => ({
    path: `/${schema}`,
    name: schema.charAt(0).toUpperCase() + schema.slice(1),
    component: () => import("pages/Table.vue"),
    props: (route) => ({ schemaName: schema }),
  }));

  // ✅ Add dynamic routes inside `MainLayout.vue`
  baseRoutes[0].children!.push(...dynamicRoutes);

  return baseRoutes;
}

// 🔹 Create Vue Router
async function createRouterInstance() {
  const routes = await getRoutes();

  const router = createRouter({
    history: createWebHistory(),
    routes,
  });

  return router;
}

export default createRouterInstance();
