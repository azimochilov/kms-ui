import { $api } from "@/utils/api";
import { defineStore } from "pinia";

export const useRequests = defineStore("request", {

    state: () => ({
        requestApiPrefix: 'requests/',
        requests: {
            data: [],
            pagination: {
                total: 0,
            },
            status_report: {
                new: 0,
                approved: 0,
                rejected: 0,
            },
        },

    }),
    actions: {
        normalizeRequest(item, index = 0) {
            return {
                ...item,
                id: item?.id ?? index + 1,
                token_sn: item?.token_sn
                    ?? item?.device?.device_id_number
                    ?? item?.device?.seria_number
                    ?? '-',
                cname: item?.cname
                    ?? item?.user?.cname
                    ?? [item?.user?.first_name, item?.user?.last_name].filter(Boolean).join(' ').trim()
                    ?? item?.user?.username
                    ?? '-',
                organization: item?.organization ?? item?.user?.organisation ?? '-',
                org_unit: item?.org_unit ?? item?.user?.org_unit ?? '-',
                branch: item?.branch ?? item?.branch_user?.branch ?? item?.user?.branch ?? '-',
                type: item?.type ?? item?.device?.type ?? '',
                client_id: item?.client_id ?? item?.user_id ?? item?.user?.id ?? item?.client?.id ?? null,
            }
        },

        buildStatusReport(items) {
            const report = {
                new: 0,
                approved: 0,
                rejected: 0,
            }

            items.forEach(item => {
                if (item?.status === 0 || item?.status === 'new')
                    report.new += 1
                else if (item?.status === 1 || item?.status === 'approved')
                    report.approved += 1
                else if (item?.status === 2 || item?.status === 'rejected')
                    report.rejected += 1
            })

            return report
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

            const items = rawItems.map((item, index) => this.normalizeRequest(item, index))
            const total = payload?.count
                ?? payload?.pagination?.total
                ?? items.length

            this.requests = {
                data: items,
                pagination: {
                    total,
                },
                status_report: payload?.status_report ?? this.buildStatusReport(items),
            }
        },

        async fetchFromAvailableEndpoints(query = {}) {
            const endpoints = [
                'requests/',
                'requests/requests/',
                'users/requests/',
            ]
            let lastError = null

            for (const endpoint of endpoints) {
                try {
                    const res = await $api(endpoint, { query })

                    this.requestApiPrefix = endpoint

                    return res
                }
                catch (error) {
                    lastError = error
                }
            }

            throw lastError
        },

        async fetchRequest(per_page, page) {
            const query = {}
            if (per_page && per_page > 0) {
                query.page_size = per_page
                query.per_page = per_page
            }
            if (page)
                query.page = page

            const res = await this.fetchFromAvailableEndpoints(query)
            this.normalizeListResponse(res)
        },

        async createStatus(id, data) {
            if (data?.status === '1') {
                // approve — o'zgarmaydi, to'g'ri ishlaydi
                const formData = new FormData()
                formData.append('id', String(id))
                formData.append('cng', String(data?.cng ?? 0))
                if (data?.user_id)
                    formData.append('user_id', String(data.user_id))
                if (data?.password)
                    formData.append('password', String(data.password))

                return await $api(`${this.requestApiPrefix}${id}/approve/`, {
                    method: 'POST',
                    body: formData,
                })
            }

            // TUZATISH: request_id body'dan olib tashlandi — URL'dagi id yetarli
            return await $api(`${this.requestApiPrefix}${id}/reject/`, {
                method: 'POST',
                body: {
                    client_id: data?.client_id,
                    comment:   data?.comment ?? '',
                    // request_id: id  <-- bu satr o'chirildi
                },
            })
        },
        // async createStatus(id, data) {
        //     if (data?.status === '1') {
        //         const formData = new FormData()
        //         formData.append('id', String(id))
        //         formData.append('cng', String(data?.cng ?? 0))
        //         if (data?.user_id)
        //             formData.append('user_id', String(data.user_id))
        //         if (data?.password)
        //             formData.append('password', String(data.password))

        //         return await $api(`${this.requestApiPrefix}${id}/approve/`, {
        //             method: 'POST',
        //             body: formData,
        //         })
        //     }

        //     return await $api(`${this.requestApiPrefix}${id}/reject/`, {
        //         method: 'POST',
        //         body: {
        //             request_id: id,
        //             client_id: data?.client_id,
        //             comment: data?.comment ?? '',
        //         },
        //     })
        // },
        async deleteRequest(id) {
            return await $api(`${this.requestApiPrefix}${id}/delete/`, {
                method: 'POST'
            })
        },
        async filterRequest(status) {
            const res = await this.fetchFromAvailableEndpoints({ status })
            this.normalizeListResponse(res)
        }


    }
})
