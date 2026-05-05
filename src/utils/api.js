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
})
