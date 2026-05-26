import { defineStore } from "pinia";
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';
import { parseApiError } from '@/utils/parseApiError';

export const useToast = defineStore("toast", {
    state: () => ({
        loginToast: false,
    }),
    actions: {
        successToast(text) {
            toast.success(text, { autoClose: 3000 })
        },

        // Oddiy string xabar uchun
        errorToast(message) {
            toast.error(String(message ?? 'Xatolik yuz berdi'), { autoClose: 7000 })
        },

        // API / fetch error objecti uchun — avtomatik parse qiladi
        apiErrorToast(error, fallback) {
            const messages = parseApiError(error, fallback)
            messages.forEach(msg => {
                toast.error(msg, { autoClose: 7000 })
            })
        },

        // Eski backward-compat (ba'zi joylarda ishlatilgan)
        errorsNotfications(data) {
            if (!data || typeof data !== 'object') return
            Object.values(data).forEach(errors => {
                const list = Array.isArray(errors) ? errors : [errors]
                list.forEach(msg => this.errorToast(String(msg)))
            })
        },
    },
})
