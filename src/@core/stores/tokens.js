import { $api } from "@/utils/api";
import { defineStore } from "pinia";

export const useTokens = defineStore("tokens", {
  state: () => ({
    tokens: null,
    branchStats: null,
  }),

  actions: {
    normalizeToken(item) {
      const branchUser = item?.branch_user
      const branchUserId = typeof branchUser === 'number'
        ? branchUser
        : branchUser?.id ?? item?.branch_user_id ?? null
      const branchName = (item?.branch
        ?? (typeof branchUser === 'object' && branchUser ? branchUser.branch : null)
        ?? '')
        .toString()
        .trim()

      return {
        ...item,
        branch_user_id: branchUserId,
        branch: branchName,
      }
    },

    // Tokenlar ro'yxatini olish (admin: hammasi, branch: o'zinikini)
    async fetchTokens(per_page = 12, page = 1, filters = {}) {
      const params = new URLSearchParams({
        per_page,
        page,
        ...filters,
      }).toString();

      return await $api(`tokens/?${params}`).then((res) => {
        const rawItems = res.results ?? res.data ?? []
        this.tokens = {
          data: rawItems.map(item => this.normalizeToken(item)),
          pagination: { total: res.count },
        };
      });
    },

    // Yangi token qo'shish (faqat admin)
    async createToken(data) {
      return await $api("tokens/", {
        method: "POST",
        body: data,
      });
    },

    // Tokenni o'chirish (faqat admin)
    async deleteToken(id) {
      return await $api(`tokens/${id}/`, {
        method: "DELETE",
      });
    },

    // Bitta tokenni olish
    async fetchOneToken(id) {
      return await $api(`tokens/${id}/`);
    },

    // CSV fayl orqali tokenlarni yuklash (faqat admin)
    async uploadTokens(file) {
      const formData = new FormData();
      formData.append("file", file);

      return await $api("tokens/upload/", {
        method: "POST",
        body: formData,
      });
    },

    // Tokenlarni branchga taqsimlash (faqat admin)
    async allocateTokens(branchUserId, quantity) {
      return await $api("tokens/allocate/", {
        method: "POST",
        body: {
          branch_user_id: branchUserId,
          quantity: quantity,
        },
      });
    },

    // Branch statistikasini olish
    async fetchBranchStats() {
      return await $api("tokens/branch_stats/").then((res) => {
        this.branchStats = res;
      });
    },

    // Tokenlarni o'ziga biriktirish (faqat branch user)
    async assignTokens(seriaNumbers) {
      return await $api("tokens/assign/", {
        method: "POST",
        body: {
          seria_numbers: seriaNumbers,
        },
      });
    },
  },
});