<script setup>
import { useToast } from '@/@core/stores/toastConfig'
import { useUsers } from '@/@core/stores/users'
import { useI18n } from 'vue-i18n'
const changePassword = ref({
    password: null,
    password_confirmation: null
})
const refForm = ref(null)
const store = useUsers()
const storeToast = useToast()
const { t } = useI18n()


const props = defineProps({
    isDialogVisible: {
        type: Boolean
    },
    passwordId: {
        type: Number || null
    }
})

const emit = defineEmits(['update:isDialogVisible', 'update:passwordId'])
const isPasswordVisible = ref(false)
const isConfirmPasswordVisible = ref(false)


const closeModal = () => {
    emit('update:isDialogVisible', false)
    emit('update:passwordId', null)

    nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()
    })

}
const handleSuccess = () => {
    storeToast.successToast(t('success'))
    emit('update:isDialogVisible', false)
    emit('update:passwordId', null)
    nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()
    })
}


const sendPassword = () => {
    refForm.value?.validate().then(({ valid }) => {
        if (valid) {
            store.changePassword(props.passwordId, changePassword.value)
                .then(() => {
                    handleSuccess()
                }).catch(error => {
                    storeToast.errorsNotfications(error.response._data.errors)

                })

        }

    })
}

</script>

<template>
    <VDialog v-model="props.isDialogVisible" max-width="600">

        <!-- Dialog close btn -->
        <DialogCloseBtn @click="closeModal" />

        <!-- Dialog Content -->
        <VCard title="User Profile">
            <VForm ref="refForm" @submit.prevent="sendPassword">
                <VCardText>

                    <VRow>

                        <VCol cols="12">
                            <AppTextField v-model="changePassword.password" label="Password" autocomplete="on"
                                placeholder="············" :type="isPasswordVisible ? 'text' : 'password'"
                                :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                                @click:append-inner="isPasswordVisible = !isPasswordVisible" :requireInput="true"
                                :rules="[requiredValidator, minLengthValidator(changePassword.password, 8)]" />
                        </VCol>

                        <VCol cols="12">
                            <AppTextField v-model="changePassword.password_confirmation" label="Password"
                                placeholder="············" :type="isConfirmPasswordVisible ? 'text' : 'password'"
                                :append-inner-icon="isConfirmPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                                @click:append-inner="isConfirmPasswordVisible = !isConfirmPasswordVisible"
                                :requireInput="true"
                                :rules="[confirmedValidator(changePassword.password_confirmation, changePassword.password)]" />
                        </VCol>


                    </VRow>
                </VCardText>


                <VCardText class="d-flex justify-end flex-wrap gap-3">
                    <VBtn variant="tonal" color="secondary" @click="closeModal">
                        Close
                    </VBtn>
                    <VBtn type="submit">
                        Save
                    </VBtn>
                </VCardText>

            </VForm>


        </VCard>
    </VDialog>
</template>
