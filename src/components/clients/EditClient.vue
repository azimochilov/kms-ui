<script setup>
import { useClient } from '@/@core/stores/client'
import { useToast } from '@/@core/stores/toastConfig'
import { useI18n } from 'vue-i18n'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'



const store = useClient()
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







const clientData = ref({

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
        clientData.value.status = true
        refForm.value?.resetValidation()
    })
}


const typeclient = ref([
    { value: 2, label: t('clients.internet_banking') },
    { value: 3, label: t('clients.mobile_banking') },
    { value: 1, label: t('clients.iabs_user') },

])

const sendClientUpdate = () => {

    refForm.value?.validate().then(({ valid }) => {

        const formDataa = new FormData()
        formDataa.append('address', clientData.value.address)
        formDataa.append('client_type', clientData.value.client_type)
        formDataa.append('cname', clientData.value.cname)
        formDataa.append('country', clientData.value.country)
        formDataa.append('email', clientData.value.email)
        formDataa.append('inn', clientData.value.inn)
        formDataa.append('location', clientData.value.location)
        formDataa.append('org_unit', clientData.value.org_unit)
        formDataa.append('organization', clientData.value.organization)
        formDataa.append('phone', clientData.value.phone)
        formDataa.append('pinfl', clientData.value.pinfl)
        formDataa.append('state', clientData.value.state)
        formDataa.append('fileToUpload', clientData.value.fileToUpload)
        if (valid) {

            store.updateClient(props.update_dataId, formDataa)
            // .then(res => {


            //     // handleSuccess()



            // }).catch(error => {
            //     console.log(error, 'errror');

            //     // storeToast.errorToast(error.response._data.message)
            // })




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
watch(() => props.update_dataId, (id) => {
    if (id) {
        store.fetchClientOneData(id).then(res => {
            let data = res.result
            clientData.value = res.result
        })





    }
}, { immediate: true })


const handleFileChange = async (event) => {
    const file = event.target.files[0]
    if (file) {
        clientData.value.fileToUpload = file



    }
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
                    <VForm ref="refForm" v-model="isFormValid" @submit.prevent="sendClientUpdate">
                        <VRow>




                            <!-- 👉  type client -->
                            <VCol cols="12">
                                <AppSelect v-model="clientData.client_type" :label="$t('clients.type')"
                                    :rules="[requiredValidator]" :items="typeclient" :requireInput="true"
                                    item-value="value" item-title="label" />
                            </VCol>



                            <!-- 👉  owner Name CN -->
                            <VCol cols="12">
                                <AppTextField v-model="clientData.cname" :rules="[requiredValidator]"
                                    :label="$t('clients.ownerNameCN')" :requireInput="true" />
                            </VCol>


                            <!-- 👉 city L -->
                            <VCol cols="12">
                                <AppTextField v-model="clientData.location" :label="$t('clients.cityL')"
                                    :requireInput="true" :rules="[requiredValidator]" />
                            </VCol>

                            <!-- 👉 regions S -->
                            <VCol cols="12">
                                <AppTextField v-model="clientData.state" :label="$t('clients.regionS')"
                                    :requireInput="true" :rules="[requiredValidator]" />
                            </VCol>


                            <!-- 👉 countryC -->
                            <VCol cols="12">
                                <AppTextField v-model="clientData.country" :label="$t('clients.countryC')"
                                    :requireInput="true" :rules="[requiredValidator]" />
                            </VCol>



                            <!-- 👉 addressStreet -->
                            <VCol cols="12">
                                <AppTextField v-model="clientData.address" :label="$t('clients.addressStreet')"
                                    :requireInput="true" :rules="[requiredValidator]" />
                            </VCol>



                            <!-- 👉 emailAddressE -->
                            <VCol cols="12">
                                <AppTextField v-model="clientData.email" :label="$t('clients.emailAddressE')"
                                    :requireInput="true" :rules="[requiredValidator]" />
                            </VCol>


                            <!-- 👉 organizationO -->
                            <VCol cols="12">
                                <AppTextField v-model="clientData.organization" :label="$t('clients.organizationO')"
                                    :requireInput="true" :rules="[requiredValidator]" />
                            </VCol>


                            <!-- 👉 subdivisionOU -->
                            <VCol cols="12">
                                <AppTextField v-model="clientData.org_unit" :label="$t('clients.subdivisionOU')"
                                    :requireInput="true" :rules="[requiredValidator]" />
                            </VCol>


                            <!-- 👉  inn -->
                            <VCol cols="12">
                                <AppTextField v-model="clientData.inn" :label="$t('clients.inn')" :requireInput="true"
                                    :rules="[requiredValidator]" />
                            </VCol>


                            <!-- 👉 emailAddressE
                            <VCol cols="12">
                                <AppTextField v-model="clientData.f_name" :label="$t('clients.emailAddressE')"
                                    :requireInput="true" :rules="[requiredValidator]" />
                            </VCol> -->


                            <!-- 👉 personalIdentificationNumber -->
                            <VCol cols="12">
                                <AppTextField v-model="clientData.pinfl"
                                    :label="$t('clients.personalIdentificationNumber')" :requireInput="true"
                                    :rules="[requiredValidator]" />
                            </VCol>

                            <!-- 👉 phoneNumber -->
                            <VCol cols="12">
                                <AppTextField v-model="clientData.phone" :label="$t('clients.phoneNumber')"
                                    :rules="[minLengthValidator(clientData.mfo, 5), maxLengthValidator(clientData.mfo, 5), requiredValidator]"
                                    :requireInput="true" />
                            </VCol>




                            <VCol cols="12" sm="12" class="">
                                <label> {{ $t('clients.attachRequestFile') }}</label>

                                <div class="custom-file-upload">
                                    <label for="file-upload">
                                        <VIcon icon="tabler-upload" />
                                        <span id="file-name">{{ $t('clients.chooseFile') }}</span>
                                    </label>
                                    <input id="file-upload" type="file" hidden @change="handleFileChange" accept=".pdf">
                                </div>

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


<style lang="scss" scoped>
.custom-file-upload {
    border: 2px dashed #d1d5db;
    border-radius: 6px;
    margin-top: 4px;
    display: flex;
    align-items: center;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;

}

.custom-file-upload label {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    color: #4b5563;
    width: 100%;
    padding: 20px;
}
</style>
