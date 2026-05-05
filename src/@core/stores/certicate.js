import { $api } from "@/utils/api";
import { defineStore } from "pinia";

export const useCertificate = defineStore("certificate", {

    state: () => ({
        certificateApiPrefix: 'certificates/',
        certificates: {
            data: [],
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
                if (item?.status === 3 || item?.status === 'active')
                    report.active += 1
                else if (item?.status === 2 || item?.status === 'updated')
                    report.updated += 1
                else if (item?.status === 1 || item?.status === 'revoked')
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

            const items = rawItems.map((item, index) => this.normalizeCertificate(item, index))
            const total = payload?.count
                ?? payload?.pagination?.total
                ?? items.length

            this.certificates = {
                data: items,
                pagination: {
                    total,
                },
                status_report: payload?.status_report ?? this.buildStatusReport(items),
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
