import { $api } from "@/utils/api";
import { defineStore } from "pinia";

export const useUsers = defineStore("users", {

    state: () => ({
        userApiPrefix: 'users/',
        users: {
            data: [],
            pagination: {
                total: 0,
            },
        },

    }),
    actions: {
        getUserListEndpoint() {
            return 'users/'
        },

        getUserDetailEndpoint(id) {
            return `users//${id}`
        },

        getUserDetailEndpointFallback(id) {
            return `users/${id}`
        },

        mapRoleToApi(role) {
            if (role === 'limited')
                return 'limited_admin'

            return role
        },

        mapRoleFromApi(role) {
            if (role === 'limited_admin')
                return 'limited'

            return role
        },

        normalizeUser(item, index = 0) {
            const userId = item?.id
                ?? item?.user_id
                ?? item?.pk
                ?? item?.uid
                ?? null
            const fullName = item?.full_name
                || [item?.f_name, item?.l_name].filter(Boolean).join(' ').trim()
                || [item?.first_name, item?.last_name].filter(Boolean).join(' ').trim()
            const statusValue = Number(item?.status ?? 0)
            const statusLabel = statusValue === 1 ? 'active' : 'inactive'

            return {
                ...item,
                id: userId,
                row_index: index + 1,
                username: item?.username ?? '-',
                full_name: fullName || '-',
                branch: item?.branch ?? item?.org_unit ?? '-',
                type: this.mapRoleFromApi(item?.type ?? item?.role ?? '-'),
                mfo: item?.mfo ?? '-',
                status: statusValue,
                status_label: statusLabel,
            }
        },

        normalizeListResponse(res) {
            const payload = res?.data ?? res?.result ?? res
            const rawItems = Array.isArray(payload)
                ? payload
                : Array.isArray(payload?.results)
                    ? payload.results
                    : Array.isArray(payload?.data)
                        ? payload.data
                        : []

            const items = rawItems.map((item, index) => this.normalizeUser(item, index))
            const total = payload?.count
                ?? payload?.pagination?.total
                ?? items.length

            this.users = {
                data: items,
                pagination: {
                    total,
                },
            }
        },

        buildUserPayload(data = {}) {
            const payload = {}

            payload.username = data?.username ?? undefined
            payload.email = data?.email ?? undefined
            payload.role = this.mapRoleToApi(data?.type ?? data?.role)
            payload.branch = data?.branch ?? undefined
            payload.mfo = data?.mfo ?? undefined

            const firstName = data?.f_name ?? data?.first_name
            const lastName = data?.l_name ?? data?.last_name

            if (firstName !== undefined) {
                payload.first_name = firstName
            }

            if (lastName !== undefined) {
                payload.last_name = lastName
            }

            if (Object.prototype.hasOwnProperty.call(data, 'active'))
                payload.status = data.active ? 1 : 0
            else if (Object.prototype.hasOwnProperty.call(data, 'status'))
                payload.status = data.status

            if (data?.password)
                payload.password = data.password

            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined)
                    delete payload[key]
            })

            return payload
        },

        async fetchFromAvailableEndpoints(query = {}) {
            const endpoint = this.getUserListEndpoint()
            const res = await $api(endpoint, { query })
            this.userApiPrefix = endpoint

            return res
        },

        async requestUserDetail(id, options = {}) {
            const candidates = [
                this.getUserDetailEndpoint(id),
                this.getUserDetailEndpointFallback(id),
            ]
            let lastError = null

            for (const endpoint of candidates) {
                try {
                    return await $api(endpoint, options)
                } catch (error) {
                    const statusCode = error?.response?.status
                    if (statusCode !== 404)
                        throw error
                    lastError = error
                }
            }

            throw lastError
        },

        // create user
        async createUser(data) {
            const payload = this.buildUserPayload(data)
            return await $api(this.getUserListEndpoint(), {
                method: 'POST',
                body: payload,
            })
        },

        // get users
        async fetchUsers(per_page, page, filters = {}) {
            const query = {}
            if (per_page && per_page > 0) {
                query.page_size = per_page
                query.per_page = per_page
            }
            if (page)
                query.page = page
            const search = String(filters?.search ?? '').trim()
            if (search)
                query.search = search
            const statusValue = filters?.status
            if (statusValue !== null && statusValue !== undefined && statusValue !== '')
                query.status = Number(statusValue)

            const res = await this.fetchFromAvailableEndpoints(query)
            this.normalizeListResponse(res)
        },

        // delete user
        async deleteUsers(id) {
            return await this.requestUserDetail(id, {
                method: 'DELETE',
            })
        },

        async resolveUserIdFromRow(rowId) {
            if (!rowId)
                return rowId

            const localMatch = this.users?.data?.find(item =>
                item?.id === rowId
                || item?.user_id === rowId
                || item?.pk === rowId
                || String(item?.id) === String(rowId)
                || String(item?.user_id) === String(rowId)
                || String(item?.pk) === String(rowId),
            )

            return localMatch?.id ?? localMatch?.user_id ?? localMatch?.pk ?? rowId
        },

        async deleteUserByRowId(rowId) {
            const resolvedId = await this.resolveUserIdFromRow(rowId)

            try {
                return await this.deleteUsers(resolvedId)
            } catch {
                // As a fallback, match by row id against display/local identifiers.
                const indexedItem = this.users?.data?.find(item =>
                    item?.id === rowId
                    || item?.user_id === rowId
                    || item?.pk === rowId
                    || String(item?.id) === String(rowId)
                    || String(item?.user_id) === String(rowId)
                    || String(item?.pk) === String(rowId),
                )
                const fallbackId = indexedItem?.id ?? indexedItem?.user_id ?? indexedItem?.pk

                if (!fallbackId)
                    throw new Error('Cannot resolve user id for delete operation')

                return await this.deleteUsers(fallbackId)
            }
        },

        // update user
        async updateUsers(id, data) {
            const payload = this.buildUserPayload(data)
            return await this.requestUserDetail(id, {
                method: 'PUT',
                body: payload,
            })
        },

        async fetOneUser(id) {
            return await this.requestUserDetail(id)
        },

        async changePassword(id, data) {
            const payload = {
                old_password: data?.old_password ?? data?.password ?? undefined,
                new_password: data?.new_password ?? data?.password_confirmation ?? undefined,
            }

            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined)
                    delete payload[key]
            })

            const endpointCandidates = [
                ...(id ? [
                    `users/${id}/change-password`,
                    `users/${id}/change-password/`,
                    `Users/${id}/change-password`,
                    `Users/${id}/change-password/`,
                ] : []),
                `users/change-password`,
                `users/change-password/`,
                `Users/change-password`,
                `Users/change-password/`,
            ]
            let lastError = null

            for (const endpoint of endpointCandidates) {
                try {
                    return await $api(endpoint, {
                        method: 'POST',
                        body: payload,
                    })
                } catch (error) {
                    const statusCode = error?.response?.status
                    if (statusCode === 404) {
                        lastError = error
                        continue
                    }

                    throw error
                }
            }

            throw lastError ?? new Error('Change password endpoint not found')
        }

    }
})
