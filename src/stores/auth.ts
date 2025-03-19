// 📂 src/stores/auth.js
import { defineStore } from "pinia";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("auth_token") || null,
  }),
  actions: {
    setToken(token: string) {
      this.token = token;
      localStorage.setItem("auth_token", token);
    },
    logout() {
      this.token = null;
      localStorage.removeItem("auth_token");
    },
  },
});
