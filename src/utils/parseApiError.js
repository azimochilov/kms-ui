/**
 * Django / DRF error response formatlarini o'qib, xabar massivini qaytaradi.
 *
 * Qo'llab-quvvatlanadigan formatlar:
 *   { detail: "string" }                         ← PermissionDenied, NotFound, ...
 *   { non_field_errors: ["msg"] }                ← authenticate xatoligi
 *   { field: ["msg1", "msg2"], ... }             ← field validation
 *   { error: "string" }                          ← loyiha custom format
 *   { success: false, error: "string" }          ← loyiha custom format
 *   { message: "string" }                        ← boshqa custom format
 *   string                                       ← to'g'ridan-to'g'ri matn
 */
export function parseApiError(error, fallback = 'Xatolik yuz berdi') {
    if (!error) return [fallback]

    // To'g'ridan-to'g'ri string
    if (typeof error === 'string') return [error]

    // ofetch / axios response body
    const body = error?.data ?? error?.response?._data ?? error?.response?.data

    if (body) {
        const messages = extractFromBody(body)
        if (messages.length) return messages
    }

    // Network / timeout xatoligi (server o'chiq)
    if (error?.name === 'FetchError' || error?.code === 'ECONNREFUSED') {
        return ['Server bilan aloqa yo\'q. Iltimos, keyinroq urinib ko\'ring.']
    }

    // HTTP status bo'yicha umumiy xabar
    const status = error?.status ?? error?.response?.status
    if (status) return [httpStatusMessage(status)]

    // JS Error message
    if (typeof error?.message === 'string' && error.message)
        return [error.message]

    return [fallback]
}

function extractFromBody(body) {
    if (typeof body === 'string') return body ? [body] : []

    if (!body || typeof body !== 'object') return []

    const messages = []

    // { detail: "..." }
    if (typeof body.detail === 'string' && body.detail)
        return [body.detail]

    // { error: { detail: "..." } }
    if (typeof body.error?.detail === 'string' && body.error.detail)
        return [body.error.detail]

    // { error: "string" }
    if (typeof body.error === 'string' && body.error)
        return [body.error]

    // { message: "string" }
    if (typeof body.message === 'string' && body.message)
        return [body.message]

    // { non_field_errors: [...] }
    if (Array.isArray(body.non_field_errors)) {
        messages.push(...body.non_field_errors.map(String).filter(Boolean))
        if (messages.length) return messages
    }

    // { field: ["msg", ...], ... }  ← DRF field validation
    const skip = new Set(['success', 'status', 'code'])
    for (const [field, value] of Object.entries(body)) {
        if (skip.has(field)) continue

        if (Array.isArray(value)) {
            value.filter(Boolean).forEach(msg => {
                messages.push(`${fieldLabel(field)}: ${msg}`)
            })
        } else if (typeof value === 'string' && value) {
            messages.push(`${fieldLabel(field)}: ${value}`)
        }
    }

    return messages
}

function fieldLabel(field) {
    return field
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase())
}

function httpStatusMessage(status) {
    const map = {
        400: 'Noto\'g\'ri so\'rov',
        401: 'Autentifikatsiya talab qilinadi',
        403: 'Ruxsat yo\'q',
        404: 'Ma\'lumot topilmadi',
        408: 'So\'rov vaqti tugadi',
        409: 'Konflikt: ma\'lumot allaqachon mavjud',
        422: 'Ma\'lumotlar noto\'g\'ri',
        429: 'Juda ko\'p so\'rov. Iltimos, bir ozdan keyin urinib ko\'ring',
        500: 'Server xatoligi',
        502: 'Server javob bermayapti',
        503: 'Xizmat vaqtincha mavjud emas',
    }
    return map[status] ?? `Xatolik (${status})`
}
