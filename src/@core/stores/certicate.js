import { $api } from "@/utils/api";
import { defineStore } from "pinia";

export const useCertificate = defineStore("certificate", {

    state: () => ({
        certificateApiPrefix: 'certificates/',
        certificates: {
            data: [],
            all_data: [],
            pagination: {
                total: 0,
            },
            status_report: {
                active: 0,
                updated: 0,
                rejected: 0,
            },
        },

    }),
    actions: {
        normalizeCertificate(item, index = 0) {
            const fullName = [
                item?.user?.first_name,
                item?.user?.last_name,
            ].filter(Boolean).join(' ').trim()

            return {
                ...item,
                id: item?.id ?? index + 1,
                cname: item?.cname
                    ?? item?.owner_name
                    ?? fullName
                    ?? item?.user?.username
                    ?? '-',
                token_sn: item?.token_sn
                    ?? item?.token_serial_number
                    ?? item?.token?.seria_number
                    ?? item?.request?.token_serial_number
                    ?? '-',
                cert_sn: item?.cert_sn ?? item?.certificate_serial_number ?? '-',
                cert_from: item?.cert_from ?? item?.from_date ?? '-',
                cert_to: item?.cert_to ?? item?.to_date ?? '-',
            }
        },

        buildStatusReport(items) {
            const report = {
                active: 0,
                updated: 0,
                rejected: 0,
            }

            items.forEach(item => {
                const statusValue = Number(item?.status)

                if (statusValue === 4)
                    report.active += 1
                else if (statusValue === 3)
                    report.updated += 1
                else if (statusValue === 0)
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
                    active: Number(backendReport.active ?? backendReport.installed ?? 0),
                    updated: Number(backendReport.updated ?? 0),
                    rejected: Number(backendReport.rejected ?? backendReport.revoked ?? 0),
                }
                : this.buildStatusReport(items)

            report.total = Number(payload?.count ?? items.length)

            return report
        },

        normalizeListResponse(res, options = {}) {
            const { updateStatusReport = false } = options
            const payload = res?.data ?? res?.result ?? res
            const rawItems = this.extractRawItems(payload)
            const items = rawItems.map((item, index) => this.normalizeCertificate(item, index))
            const total = payload?.count
                ?? payload?.pagination?.total
                ?? items.length

            this.certificates = {
                data: items,
                pagination: {
                    total,
                },
                status_report: updateStatusReport
                    ? this.parseStatusReport(payload, items)
                    : this.certificates.status_report,
            }
        },

        async fetchFromAvailableEndpoints(query = {}) {
            const endpoints = [
                'certificates/',
                'certificates/certificates/',
                'users/certificates/',
            ]
            let lastError = null

            for (const endpoint of endpoints) {
                try {
                    const res = await $api(endpoint, { query })

                    this.certificateApiPrefix = endpoint

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
                const items = rawItems.map((item, index) => this.normalizeCertificate(item, index))

                this.certificates.all_data = items
                this.certificates.data = items
                this.certificates.pagination.total = Number(payload?.count ?? items.length)
                this.certificates.status_report = this.parseStatusReport(payload, items)
            }
            catch {
                // Keep the previous report if stats request fails.
            }
        },

        async fetchCertificate(per_page, page) {
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


        async deleteCertificate(id) {
            return await $api(`${this.certificateApiPrefix}${id}/`, {
                method: 'delete'
            })
        },
        async filterCertificate(status) {
            const res = await this.fetchFromAvailableEndpoints({ status })
            this.normalizeListResponse(res)
        }


    }
})
