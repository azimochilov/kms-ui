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
        filterOptions: {
            usernames: [],
            actions: [],
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

        mergeFilterOptionsFromItems(items) {
            const usernames = new Set(this.filterOptions.usernames)
            const actions = new Set(this.filterOptions.actions)

            items.forEach(item => {
                if (item?.username && item.username !== '-')
                    usernames.add(item.username)
                if (item?.action && item.action !== '-')
                    actions.add(item.action)
            })

            this.filterOptions = {
                usernames: [...usernames].sort(),
                actions: [...actions].sort(),
            }
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

            this.mergeFilterOptionsFromItems(items);
        },

        async fetchFromAvailableEndpoints(query = {}, endpoints = null) {
            const resolvedEndpoints = endpoints ?? [
                "logs/audit/",
                "logs/audit",
                "audit/",
            ];

            let lastError = null;
            for (const endpoint of resolvedEndpoints) {
                try {
                    const res = await $api(endpoint, { query });
                    if (!endpoints)
                        this.logsApiPrefix = endpoint;

                    return res;
                }
                catch (error) {
                    lastError = error;
                }
            }

            throw lastError;
        },

        async fetchFilterOptions() {
            const endpoints = [
                "logs/audit/filters/",
                "logs/audit/filters",
                "audit/filters/",
            ];

            try {
                const res = await this.fetchFromAvailableEndpoints({}, endpoints);
                const payload = res?.data ?? res?.result ?? res;

                this.filterOptions = {
                    usernames: Array.isArray(payload?.usernames) ? payload.usernames : [],
                    actions: Array.isArray(payload?.actions) ? payload.actions : [],
                };
            }
            catch {
                this.filterOptions = { usernames: [], actions: [] };
            }
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
