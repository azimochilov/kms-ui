// api/client/

import { $api } from "@/utils/api";
import { defineStore } from "pinia";

export const useClient = defineStore("client", {

    state: () => ({
        clientApiPrefix: 'clients/',
        clients: {
            data: [],
            pagination: {
                total: 0,
            },
        },

    }),
    actions: {
        async fetchFromAvailableEndpoints(query = {}) {
            const res = await $api('clients/', { query })
            this.clientApiPrefix = 'clients/'
            return res
        },

        // creat client 
        async createUser(data) {
            return await $api('api/user/store ', {
                method: 'Post',
                body: data
            })
        },

        // get client
        async fetchClient(per_page, page, filters = {}) {
            const query = {}
            const perPageNumber = Number(per_page)
            if (Number.isFinite(perPageNumber) && perPageNumber > 0) {
                query.size = perPageNumber
                query.page_size = perPageNumber
                query.per_page = perPageNumber
            }
            else if (perPageNumber === -1) {
                // "All" option from UI: request max allowed page size
                query.size = 500
                query.page_size = 500
                query.per_page = 500
            }
            query.page = page || 1
            const search = String(filters?.search ?? '').trim()
            if (search)
                query.search = search
            const statusValue = filters?.status
            if (statusValue !== null && statusValue !== undefined && statusValue !== '')
                query.status = Number(statusValue)

            return await this.fetchFromAvailableEndpoints(query).then(res => {
                const payload = res?.result ?? res
                const data = Array.isArray(payload)
                    ? payload
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : Array.isArray(payload?.results)
                            ? payload.results
                            : []
                const total = payload?.pagination?.total ?? payload?.count ?? data.length

                this.clients = {
                    data,
                    pagination: { total },
                }
            })
        },

        // delete client 
        async deleteClient(id) {
            return await $api(`${this.clientApiPrefix}${id}/`, {
                method: "delete"
            })
        },

        // updata client
        async updateClient(id, data) {
            return await $api(`${this.clientApiPrefix}${id}/`, {
                method: 'PATCH',
                body: data,
                headers: {
                    maxRedirects: 0

                }

            })
        },
        // get one client 
        async fetOneClient(id) {
            return await $api(`${this.clientApiPrefix}${id}/`)
        },
        async changePassword(id, data) {
            return await $api(`api/user/password/${id}`, {
                method: "Patch",
                body: data
            })
        },
        async fetchClientOneData(id) {
            return await $api(`${this.clientApiPrefix}${id}/`)
        },
        async createDevice(data) {
            return await $api('devices/', {
                method: 'POST',
                body: data
            })
        },
        async deleteDevice(id) {
            return await $api(`devices/${id}/delete/`, {
                method: 'delete'
            })
        },
        async createClients(data) {
            console.log(data);

            return await $api(`${this.clientApiPrefix}`, {
                method: 'Post',
                body: data,
                redirect: 'error'
            })
        },

    }
})
