<script setup>
import { useToast } from '@/@core/stores/toastConfig'
import { useUsers } from '@/@core/stores/users'
import { useI18n } from 'vue-i18n'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'



const store = useUsers()
const storeToast = useToast()
const { t } = useI18n()



const props = defineProps({
    isDrawerOpen: {
        type: Boolean,
        required: true,
    },
    update_dataId: {
        type: Number || null,
        default: null
    }
})

const emit = defineEmits([
    'update:isDrawerOpen',
    'update:update_dataId',
    'refresh'
])

const isFormValid = ref(false)
const refForm = ref()







const tokenFile = ref(null)
const isPasswordVisible = ref(false)

const handleSuccess = () => {
    storeToast.successToast(t('success'))
    emit('update:isDrawerOpen', false)
    emit('update:update_dataId', null)
    emit('refresh')
    nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()
    })
}

// 👉 drawer close
const closeNavigationDrawer = () => {
    emit('update:isDrawerOpen', false)
    emit('update:update_dataId', null)
    nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()
    })
}

const onSubmit = () => {
    refForm.value?.validate().then(({ valid }) => {
        console.log(refForm.value);


        if (valid) {
            if (!props.update_dataId) {
                store.createUser(tokenFile.value)
                    .then(res => {

                        handleSuccess()



                    }).catch(error => {
                        storeToast.errorToast(error.response._data.message)
                    })
            } else {

                store.updateUsers(props.update_dataId, tokenFile.value)
                    .then(() => {

                        handleSuccess()
                    }).catch(error => {
                        storeToast.errorsNotfications(error.response._data.errors)
                    })
            }



        } else {
            storeToast.errorToast(t('required_fiels'))


        }
    })
}

const handleDrawerModelValueUpdate = val => {
    emit('update:isDrawerOpen', val)
    emit('update:update_dataId', null)
    nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()
    })
}


// Watcher to update the form fields when props.update_data change  s
// watch(() => props.update_dataId, (id) => {
//     if (id) {
//         store.fetOneUser(id).then(res => {
//             let data = res.result
//             tokenFile.value = {
//                 username: data.username || null,
//                 email: data.email || null,
//                 f_name: data.f_name || null,
//                 l_name: data.l_name || null,
//                 type: data.type || null,
//                 active: data.status == 1 ? true : false,
//                 mfo: data.mfo,
//                 branch: data.branch
//             }

//         })





//     }
// }, { immediate: true })
</script>

<template>
    <VNavigationDrawer temporary :width="400" location="end" class="scrollable-content"
        :model-value="props.isDrawerOpen" @update:model-value="handleDrawerModelValueUpdate">
        <!-- 👉 Title -->
        <AppDrawerHeaderSection :title="!props.update_dataId ? $t('settingsModule.add') : $t('settingsModule.edit')"
            @cancel="closeNavigationDrawer" />

        <PerfectScrollbar :options="{ wheelPropagation: false }">
            <VCard flat>
                <VCardText>


                    <!-- 👉 Form -->
                    <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
                        <VRow>





                            <VCol cols="12">
                                <label>Прикрепить файл запроса<span class="asterisk">*</span>
                                </label>
                                <VFileInput v-model="tokenFile" color="primary" variant="outlined"
                                    :rules="[requiredValidator]" />
                            </VCol>
















                            <!-- 👉 Submit and Cancel -->
                            <VCol cols="12">
                                <VBtn type="submit" class="me-3">
                                    {{ $t('settingsModule.send') }}
                                </VBtn>

                            </VCol>
                        </VRow>
                    </VForm>
                </VCardText>
            </VCard>
        </PerfectScrollbar>
    </VNavigationDrawer>
</template>

<style lang="scss">
.asterisk {
    color: #ea5455;
}
</style>
