import { defineStore } from 'pinia'
import { $api } from '@/utils/api'

const REPORT_ENDPOINTS = {
  meta: ['reports/meta/', 'reports/meta'],
  summary: ['reports/summary/', 'reports/summary'],
  summaryExport: ['reports/summary/export/', 'reports/summary/export'],
  cb: ['reports/cb/', 'reports/cb'],
  cbExport: ['reports/cb/export/', 'reports/cb/export'],
  usersExport: ['reports/users/export/', 'reports/users/export'],
  lostTokensExport: ['reports/lost-tokens/export/', 'reports/lost-tokens/export'],
}

const unwrapPayload = res => res?.data ?? res?.result ?? res
const extractErrorStatus = error => error?.response?.status ?? error?.status ?? null
const shouldTryNextEndpoint = error => {
  const status = extractErrorStatus(error)

  // Retry only when endpoint likely doesn't exist.
  return status === 404 || status === 405 || status === null
}

const normalizeEndpointPath = endpoint => String(endpoint || '').replace(/^\/+/, '')

const buildAbsoluteUrl = endpoint => {
  const baseURL = String(import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
  const cleanEndpoint = normalizeEndpointPath(endpoint)

  return `${baseURL}/${cleanEndpoint}`
}

const parseFilenameFromDisposition = (contentDisposition = '', fallbackName = 'report') => {
  const match = contentDisposition.match(/filename\*?=(?:UTF-8''|")?([^";\n]+)/i)
  if (!match?.[1])
    return fallbackName

  const raw = match[1].replace(/"/g, '').trim()

  try {
    return decodeURIComponent(raw)
  }
  catch {
    return raw || fallbackName
  }
}

const saveBlobFile = (blob, fileName) => {
  const href = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = href
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(href)
}

export const useReports = defineStore('reports', {
  state: () => ({
    branches: [],
    summary: {
      filters: {},
      branches: [],
      totals: {
        total: 0,
        active_count: 0,
        revoked_count: 0,
        imported_count: 0,
        updated_count: 0,
        clients_count: 0,
      },
    },
    cbMetrics: {
      total: 0,
      assigned_count: 0,
      unassigned_count: 0,
      attached_count: 0,
      detached_count: 0,
      used_count: 0,
      active_count: 0,
    },
  }),
  actions: {
    async requestFromEndpoints(endpoints, options = {}) {
      let lastError = null

      for (const endpoint of endpoints) {
        try {
          return await $api(endpoint, options)
        }
        catch (error) {
          lastError = error
          if (!shouldTryNextEndpoint(error))
            throw error
        }
      }

      throw lastError
    },

    async fetchMeta() {
      const response = await this.requestFromEndpoints(REPORT_ENDPOINTS.meta)
      const payload = unwrapPayload(response)
      this.branches = Array.isArray(payload?.branches) ? payload.branches : []

      return this.branches
    },

    async fetchSummary(filters) {
      const body = {
        from: filters?.from_date,
        to: filters?.to_date,
      }

      if (filters?.branch)
        body.branch = filters.branch

      const response = await this.requestFromEndpoints(REPORT_ENDPOINTS.summary, {
        method: 'POST',
        body,
      })
      const payload = unwrapPayload(response) || {}

      this.summary = {
        filters: payload?.filters || {},
        branches: Array.isArray(payload?.branches) ? payload.branches : [],
        totals: payload?.totals || {
          total: 0,
          active_count: 0,
          revoked_count: 0,
          imported_count: 0,
          updated_count: 0,
          clients_count: 0,
        },
      }

      return this.summary
    },

    async fetchCBMetrics() {
      const response = await this.requestFromEndpoints(REPORT_ENDPOINTS.cb)
      const payload = unwrapPayload(response) || {}
      this.cbMetrics = {
        total: Number(payload?.total || 0),
        assigned_count: Number(payload?.assigned_count || 0),
        unassigned_count: Number(payload?.unassigned_count || 0),
        attached_count: Number(payload?.attached_count || 0),
        detached_count: Number(payload?.detached_count || 0),
        used_count: Number(payload?.used_count || 0),
        active_count: Number(payload?.active_count || 0),
      }

      return this.cbMetrics
    },

    async downloadFromEndpoints(endpoints, { method = 'GET', body, defaultFileName = 'report' } = {}) {
      const token = useCookie('accessToken').value
      let lastError = null

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(buildAbsoluteUrl(endpoint), {
            method,
            headers: {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
              ...(body ? { 'Content-Type': 'application/json' } : {}),
            },
            body: body ? JSON.stringify(body) : undefined,
          })

          if (!response.ok) {
            const message = await response.text()
            const error = new Error(message || `Request failed with status ${response.status}`)

            error.status = response.status
            throw error
          }

          const contentDisposition = response.headers.get('content-disposition') || ''
          const fileName = parseFilenameFromDisposition(contentDisposition, defaultFileName)
          const fileBlob = await response.blob()
          saveBlobFile(fileBlob, fileName)

          return { fileName }
        }
        catch (error) {
          lastError = error
          if (!shouldTryNextEndpoint(error))
            throw error
        }
      }

      throw lastError
    },

    async exportSummary(filters, format) {
      const extension = format === 'excel' ? 'xlsx' : 'pdf'

      return await this.downloadFromEndpoints(REPORT_ENDPOINTS.summaryExport, {
        method: 'POST',
        body: {
          from: filters?.from_date,
          to: filters?.to_date,
          branch: filters?.branch || '',
          format,
        },
        defaultFileName: `summary_report.${extension}`,
      })
    },

    async exportCB() {
      return await this.downloadFromEndpoints(REPORT_ENDPOINTS.cbExport, {
        method: 'GET',
        defaultFileName: 'cb_report.xlsx',
      })
    },

    async exportUsersRegistry() {
      return await this.downloadFromEndpoints(REPORT_ENDPOINTS.usersExport, {
        method: 'GET',
        defaultFileName: 'users_registry.pdf',
      })
    },

    async exportLostTokensRegistry() {
      return await this.downloadFromEndpoints(REPORT_ENDPOINTS.lostTokensExport, {
        method: 'GET',
        defaultFileName: 'lost_tokens_registry.pdf',
      })
    },
  },
})
