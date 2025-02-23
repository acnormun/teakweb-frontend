import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';

import routerPromise from './routes'; // ✅ Import router as a Promise

export default route(async function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory()
    : process.env.VUE_ROUTER_MODE === 'history'
    ? createWebHistory()
    : createWebHashHistory();

  // ✅ Wait for routes to be ready before creating the router
  const router = await routerPromise;
  return router;
});
