<script setup>
import { useRequests } from '@/@core/stores/request'
import { useToast } from '@/@core/stores/toastConfig'
import { useI18n } from 'vue-i18n'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'



const store = useRequests()
const storeToast = useToast()
const { t } = useI18n()




const props = defineProps({
    isDrawerOpen: {
        type: Boolean,
        required: true,
    },
    status_type: {
        type: String || null,
        default: null
    },
    request_id: {
        type: Number || null,
        default: null
    },
    request_item: {
        type: Object || null,
        default: null,
    }
})

const emit = defineEmits([
    'update:isDrawerOpen',
    'update:update_dataId',
    'refresh'
])

const isFormValid = ref(false)
const refForm = ref()
const statusData = ref({
    cng: null,
    status: null,
    comment: '',

})

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
        statusData.value.status = true
        refForm.value?.resetValidation()
    })
}

const onSubmit = () => {

    refForm.value?.validate().then(({ valid }) => {

        if (valid) {

            if (props.status_type == 'confirmation') {
                statusData.value.status = '1'
                statusData.value.user_id = props.request_item?.client_id
            } else {
                statusData.value.status = '2'
                statusData.value.client_id = props.request_item?.client_id
                statusData.value.cng = '0'


            }

            store.createStatus(props.request_id, statusData.value)
                .then(res => {
                    handleSuccess()
                }).catch(error => {
                    const message = error?.response?._data?.message ?? error?.response?._data?.error ?? error?.message
                    storeToast.errorToast(message || t('error'))
                })
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


</script>

<template>
    <VNavigationDrawer temporary :width="400" location="end" class="scrollable-content"
        :model-value="props.isDrawerOpen" @update:model-value="handleDrawerModelValueUpdate">
        <!-- 👉 Title -->
        <AppDrawerHeaderSection
            :title="props.status_type == 'confirmation' ? 'Sertifikat turini tanlang' : 'Fikr qoldiring'"
            @cancel="closeNavigationDrawer" />

        <PerfectScrollbar :options="{ wheelPropagation: false }">
            <VCard flat>
                <VCardText>


                    <!-- 👉 Form -->
                    <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit"
                        v-if="props.status_type == 'confirmation'">
                        <VRow>




                            <VCol cols="12">
                                <AppSelect :items="[{ value: '1', label: 'Styx Software Key storage provider' }]" v-model="statusData.cng"
                                    item-value="value" item-title="label" :rules="[requiredValidator]" />
                            </VCol>



                            <!-- 👉 Submit and Cancel -->
                            <VCol cols="12">
                                <VBtn type="submit" class="me-3">
                                    {{ $t('settingsModule.send') }}
                                </VBtn>

                            </VCol>




                        </VRow>
                    </VForm>

                    <!-- 👉 Form -->
                    <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit" v-else>
                        <VRow>
                            <!-- 👉 type -->
                            <VCol cols="12">
                                <AppTextField v-model="statusData.comment" :rules="[requiredValidator]" label="izox"
                                    :requireInput="true" type="text" />
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
