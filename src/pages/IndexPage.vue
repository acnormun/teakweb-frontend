<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md shadow-2" style="width: 350px">
      <q-card-section>
        <div class="text-h6">Welcome</div>
      </q-card-section>

      <!-- 🔹 Mostra Login se NÃO estiver autenticado -->
      <q-card-section v-if="!authStore.token">
        <q-input v-model="username" label="Username" outlined dense />
        <q-input v-model="password" label="Password" outlined dense type="password" class="q-mt-md" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-if="!authStore.token" color="primary" label="Login" @click="login" :loading="loading" />
        <q-btn v-else color="negative" label="Logout" @click="logout" />
      </q-card-actions>

      <q-banner v-if="error" class="bg-red-3 text-white q-mt-md">
        {{ error }}
      </q-banner>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { Notify } from "quasar";
import { useAuthStore } from "../stores/auth"; // 🔥 Importa a Store

const authStore = useAuthStore();
const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref(null);
const router = useRouter();

// 🔹 Login Function
const login = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await axios.post("http://127.0.0.1:5000/api/login", {
      username: username.value,
      password: password.value,
    });

    authStore.setToken(response.data.auth_token); // 🔥 Atualiza a store

    Notify.create({
      type: "positive",
      message: "Login bem-sucedido!",
      position: "bottom",
      timeout: 3000,
    });

    // NÃO precisa dar refresh, pois o Vue reativa a tela automaticamente
  } catch (err) {
    error.value = err.response?.data?.error || "Login falhou";

    Notify.create({
      type: "negative",
      message: error.value,
      position: "bottom",
    });
  } finally {
    loading.value = false;
  }
};

// 🔹 Logout Function
const logout = () => {
  authStore.logout(); // 🔥 Atualiza a store

  Notify.create({
    type: "negative",
    message: "Logout bem-sucedido!",
    position: "bottom",
  });

  // NÃO precisa dar refresh!
};
</script>
