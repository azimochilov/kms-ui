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
        async fetchClient(per_page, page) {
            const query = {}
            if (per_page && per_page > 0) {
                query.page_size = per_page
                query.per_page = per_page
            }
            if (page)
                query.page = page

            return await this.fetchFromAvailableEndpoints(query).then(res => {
                this.clients = res?.result ?? res
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
            return await $api('api/device/store', {
                method: 'Post',
                body: data
            })
        },
        async deleteDevice(id) {
            return await $api(`api/device/delete/${id}`, {
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
