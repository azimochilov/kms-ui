import { defineStore } from "pinia";
import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

export const useToast = defineStore("toast", {

    state: () => ({
        loginToast: false

    }),
    actions: {
        // notificaton
        successToast(text) {
            toast.success(text, {
                autoClose: 3000,
            }) // ToastOptions
        },

        errorToast(errorData) {
            toast.error(errorData, {
                autoClose: 7000,
            }) // ToastOptions
        },

        errorsNotfications(data) {
            let dataObject = Object.keys(data)

            dataObject.forEach(item => {
                data[item].forEach(elemet => {
                    this.errorToast(elemet)

                })
            })
        }




    }
})
