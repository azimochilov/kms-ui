import { $api } from "@/utils/api";
import { defineStore } from "pinia";

export const useUsers = defineStore("users", {

    state: () => ({
        users: null

    }),
    actions: {
        // creat user 
        async createUser(data) {
            return await $api('api/user/store ', {
                method: 'Post',
                body: data
            })
        },

        // get users 
        // async fetchUsers(per_page, page) {
        //     return await $api(`users?per_page=${per_page}&page=${page}`).then(res => {
        //         this.users = res.results
        //         console.log(this.users);
        //     })
        // },

        async fetchUsers(per_page, page) {
            return await $api(`tokens?per_page=${per_page}&page=${page}`).then(res => {
                this.users = {
                    data: res.results,           // template .data kutmoqda
                    pagination: { total: res.count }  // template .pagination.total kutmoqda
                }
            })
        },

        // delete user 
        async deleteUsers(id) {
            return await $api(`api/user/delete/${id}`, {
                method: "delete"
            })
        },

        // updata user 
        async updateUsers(id, data) {
            return await $api(`api/user/update/${id}`, {
                method: 'PUT',
                body: data
            })
        },
        async fetOneUser(id) {
            return await $api(`api/user/${id}`)
        },
        async changePassword(id, data) {
            return await $api(`api/user/password/${id}`, {
                method: "Patch",
                body: data
            })
        }

    }
})
