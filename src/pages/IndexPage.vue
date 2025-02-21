<template>
  <q-page class="flex flex-center">
    <q-card class="q-pa-md shadow-2" style="width: 350px">
      <q-card-section>
        <div class="text-h6">Welcome</div>
      </q-card-section>

      <!-- 🔹 Show Login Form if NOT Authenticated -->
      <q-card-section v-if="!isAuthenticated">
        <q-input v-model="username" label="Username" outlined dense />
        <q-input v-model="password" label="Password" outlined dense type="password" class="q-mt-md" />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn v-if="!isAuthenticated" color="primary" label="Login" @click="login" :loading="loading" />
        <q-btn v-else color="negative" label="Logout" @click="logout" />
      </q-card-actions>

      <q-banner v-if="error" class="bg-red-3 text-white q-mt-md">
        {{ error }}
      </q-banner>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";

const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref(null);
const router = useRouter();

// 🔹 Check if User is Authenticated
const isAuthenticated = computed(() => !!localStorage.getItem("auth_token"));

// 🔹 Login Function
const login = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await axios.post("http://127.0.0.1:5000/api/login", {
      username: username.value,
      password: password.value,
    });

    localStorage.setItem("auth_token", response.data.auth_token);
    router.push("/"); // Redirect to Home Page
  } catch (err) {
    error.value = err.response?.data?.error || "Login failed";
  } finally {
    loading.value = false;
  }
};

// 🔹 Logout Function
const logout = () => {
  localStorage.removeItem("auth_token");
  router.push("/");
};
</script>
