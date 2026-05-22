import { $api } from "@/utils/api";
import { defineStore } from "pinia";

export const useRequests = defineStore("request", {

    state: () => ({
        requestApiPrefix: 'requests/',
        requests: {
            data: [],
            all_data: [],
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
                const statusValue = Number(item?.status)

                if (statusValue === 0)
                    report.new += 1
                else if (statusValue === 1)
                    report.approved += 1
                else if (statusValue === 2)
                    report.rejected += 1
            })

            return report
        },

        extractRawItems(payload) {
            if (Array.isArray(payload))
                return payload

            if (Array.isArray(payload?.results))
                return payload.results

            if (Array.isArray(payload?.data))
                return payload.data

            return []
        },

        parseStatusReport(payload, items) {
            const backendReport = payload?.status_report ?? payload?.statusReport
            const report = backendReport && typeof backendReport === 'object'
                ? {
                    new: Number(backendReport.new ?? backendReport.pending ?? 0),
                    approved: Number(backendReport.approved ?? 0),
                    rejected: Number(backendReport.rejected ?? 0),
                }
                : this.buildStatusReport(items)

            report.total = Number(payload?.count ?? items.length)

            return report
        },

        normalizeListResponse(res, options = {}) {
            const { updateStatusReport = false } = options
            const payload = res?.data ?? res?.result ?? res
            const rawItems = this.extractRawItems(payload)
            const items = rawItems.map((item, index) => this.normalizeRequest(item, index))
            const total = payload?.count
                ?? payload?.pagination?.total
                ?? items.length

            this.requests = {
                data: items,
                pagination: {
                    total,
                },
                status_report: updateStatusReport
                    ? this.parseStatusReport(payload, items)
                    : this.requests.status_report,
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

        async fetchStatusReport() {
            try {
                const res = await this.fetchFromAvailableEndpoints({
                    page_size: 5000,
                    page: 1,
                })
                const payload = res?.data ?? res?.result ?? res
                const rawItems = this.extractRawItems(payload)
                const items = rawItems.map((item, index) => this.normalizeRequest(item, index))

                this.requests.all_data = items
                this.requests.data = items
                this.requests.pagination.total = Number(payload?.count ?? items.length)
                this.requests.status_report = this.parseStatusReport(payload, items)
            }
            catch {
                // Keep the previous report if stats request fails.
            }
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
