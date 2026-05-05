// api/client/

import { $api } from "@/utils/api";
import { defineStore } from "pinia";

export const useClient = defineStore("client", {

    state: () => ({
        clients: {
            data: []
        }

    }),
    actions: {
        // creat client 
        async createUser(data) {
            return await $api('api/user/store ', {
                method: 'Post',
                body: data
            })
        },

        // get client
        async fetchClient(per_page, page) {
            return await $api(`api/client?per_page=${per_page}&page=${page}`).then(res => {
                this.clients = res.result
            })
        },

        // delete client 
        async deleteClient(id) {
            return await $api(`api/client/delete/${id}`, {
                method: "delete"
            })
        },

        // updata client
        async updateClient(id, data) {
            return await $api(`api/client/update/${id}`, {
                method: 'post',
                body: data,
                headers: {
                    maxRedirects: 0

                }

            })
        },
        // get one client 
        async fetOneClient(id) {
            return await $api(`api/client/${id}`)
        },
        async changePassword(id, data) {
            return await $api(`api/user/password/${id}`, {
                method: "Patch",
                body: data
            })
        },
        async fetchClientOneData(id) {
            return await $api(`api/client/edit/${id}`)
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

            return await $api(`api/client/store`, {
                method: 'Post',
                body: data,
                redirect: 'error'
            })
        },

    }
})
