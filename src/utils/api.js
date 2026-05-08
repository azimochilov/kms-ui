import { ofetch } from 'ofetch';


export const $api = ofetch.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  async onRequest({ options }) {


    if (!navigator.onLine) {
      useToast().errorToast(getI18n().global.t('no_internet'))

      return
    }
    const accessToken = useCookie('accessToken').value
    if (accessToken) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,

      }
    }
  },
  async onResponseError({ response }) {
    const statusCode = response?.status ?? response?._data?.status_code
    const detailMessage = response?._data?.error?.detail ?? response?._data?.detail ?? ''
    const isExpiredToken = String(detailMessage).toLowerCase().includes('expired token')

    if (statusCode === 401 || isExpiredToken) {
      useCookie('userAbilityRules').value = null
      useCookie('userData').value = null
      useCookie('accessToken').value = null

      if (typeof window !== 'undefined' && window.location.pathname !== '/login')
        window.location.replace('/login')
    }
  },
})
