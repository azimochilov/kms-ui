<script setup>
import { useClient } from '@/@core/stores/client'
import { useToast } from '@/@core/stores/toastConfig'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'



const store = useClient()
const storeToast = useToast()
const { t } = useI18n()
const route = useRoute()



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







const deviceData = ref({
    client_id: null,
    type: null,
    device_id_type: null,
    status: true,
    device_id_number: null

})
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
        deviceData.value.status = true
        refForm.value?.resetValidation()
    })
}

const onSubmit = () => {
    refForm.value?.validate().then(({ valid }) => {
        deviceData.value.client_id = route.params.id


        if (valid) {
            store.createDevice(deviceData.value)
                .then(res => {
                    handleSuccess()

                }).catch(error => {
                    storeToast.errorToast(error.response._data.message)
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
        <AppDrawerHeaderSection :title="!props.update_dataId ? $t('settingsModule.add') : $t('settingsModule.edit')"
            @cancel="closeNavigationDrawer" />

        <PerfectScrollbar :options="{ wheelPropagation: false }">
            <VCard flat>
                <VCardText>


                    <!-- 👉 Form -->
                    <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
                        <VRow>

                            <!-- 👉 type -->
                            <VCol cols="12">
                                <AppTextField v-model="deviceData.type" :label="$t('settingsModule.type')" :requireInput="true"
                                    :rules="[requiredValidator]" />
                            </VCol>


                            <!-- 👉 device_id_type -->
                            <VCol cols="12">
                                <AppTextField v-model="deviceData.device_id_number" :label="$t('clients.device_id_number')"
                                    :requireInput="true" :rules="[requiredValidator]" />
                            </VCol>


                            <!-- 👉 device_id_type -->
                            <VCol cols="12">
                                <AppTextField v-model="deviceData.device_id_type" :label="$t('clients.device_id_type')"
                                    :rules="[requiredValidator]" :requireInput="true" />
                            </VCol>



                            <!-- status -->
                            <VCol class="d-flex  justify-space-between">
                                <div>{{ $t('settingsModule.activity') }}</div>
                                <VSwitch v-model="deviceData.status" />

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
