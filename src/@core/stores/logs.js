import { $api } from "@/utils/api";
import { defineStore } from "pinia";

export const useLogs = defineStore("logs", {
    state: () => ({
        logsApiPrefix: "logs/audit/",
        logs: {
            data: [],
            pagination: {
                total: 0,
            },
        },
    }),
    actions: {
        normalizeLog(item, index = 0) {
            return {
                ...item,
                id: item?.id ?? index + 1,
                username: item?.username ?? item?.actor?.username ?? "-",
                action: item?.action ?? "-",
                comment: item?.comment ?? "-",
                context: item?.context ?? {},
                ip_address: item?.ip_address ?? "-",
                created_at: item?.created_at ?? null,
            };
        },

        normalizeListResponse(res) {
            const payload = res?.data ?? res?.result ?? res;
            const rawItems = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.results)
                    ? payload.results
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : [];

            const items = rawItems.map((item, index) => this.normalizeLog(item, index));
            const total = payload?.count
                ?? payload?.pagination?.total
                ?? items.length;

            this.logs = {
                data: items,
                pagination: {
                    total,
                },
            };
        },

        async fetchFromAvailableEndpoints(query = {}) {
            const endpoints = [
                "logs/audit/",
                "logs/audit",
                "audit/",
            ];

            let lastError = null;
            for (const endpoint of endpoints) {
                try {
                    const res = await $api(endpoint, { query });
                    this.logsApiPrefix = endpoint;

                    return res;
                }
                catch (error) {
                    lastError = error;
                }
            }

            throw lastError;
        },

        async fetchLogs(per_page, page, filters = {}) {
            const query = {};
            if (per_page && per_page > 0) {
                query.page_size = per_page;
                query.per_page = per_page;
            }
            if (page)
                query.page = page;

            if (filters?.search)
                query.search = filters.search;
            if (filters?.username)
                query.username = filters.username;
            if (filters?.action)
                query.action = filters.action;
            if (filters?.date_from)
                query.date_from = filters.date_from;
            if (filters?.date_to)
                query.date_to = filters.date_to;

            const res = await this.fetchFromAvailableEndpoints(query);
            this.normalizeListResponse(res);
        },
    },
});
