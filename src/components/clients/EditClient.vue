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
    client_type: null,
    cert_type: null,
    cname: '',
    sname: '',
    accname: '',
    description: '',
    job: '',
    location: '',
    state: '',
    country: '',
    address: '',
    email: '',
    organization: '',
    org_unit: '',
    inn: '',
    pinfl: '',
    phone: '',
    fileToUpload: null,
})

// --- visibility ---
const showSname   = ref(false)
const showAccname = ref(false)
const showDesc    = ref(false)
const showJob     = ref(false)
const showInn     = ref(false)
const showPinfl   = ref(false)
const showTypeClient = ref(true)

const OU_MAP = {
    2: 'UZC003',
    1: 'UZB003',
    3: 'UZC003',
    4: 'UZC003',
    7: 'UZM003',
    5: 'UZJ003',
    6: 'UZS003',
}

const updateVisibility = () => {
    const ct = Number(clientData.value.cert_type)
    const tc = Number(clientData.value.client_type)

    const isMobile = [3, 4, 7].includes(ct)   // cert_type=2 (internet banking) mobile emas
    const isIABS   = ct === 1

    showTypeClient.value = !isIABS

    if (isIABS) {
        showSname.value   = false
        showAccname.value = false
        showDesc.value    = true
        showJob.value     = true
        showInn.value     = false
        showPinfl.value   = true
    } else {
        showSname.value   = true
        showAccname.value = true
        showDesc.value    = false
        showJob.value     = false
        if (!tc) {
            showInn.value   = true
            showPinfl.value = true
        } else {
            showInn.value   = tc === 1
            showPinfl.value = tc === 2
        }
    }
}

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

const closeNavigationDrawer = () => {
    emit('update:isDrawerOpen', false)
    emit('update:update_dataId', null)
    nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()
    })
}

const typeclient = computed(() => [
    { value: 1, label: t('clients.legal_person') },
    { value: 2, label: t('clients.physical_person') },
])

watch(() => clientData.value.client_type, (newVal) => {
    if (Number(newVal) === 2 && clientData.value.address) {
        clientData.value.location = clientData.value.address
    }
    updateVisibility()
})

const sendClientUpdate = () => {
    refForm.value?.validate().then(({ valid }) => {
        if (!valid) {
            storeToast.errorToast(t('required_fiels'))
            return
        }

        const formDataa = new FormData()
        const d = clientData.value

        const fields = [
            'address', 'client_type', 'cname', 'sname', 'accname',
            'description', 'job', 'country', 'email', 'inn',
            'location', 'org_unit', 'organization', 'phone', 'pinfl', 'state',
        ]

        for (const key of fields) {
            const val = d[key]
            if (val !== null && val !== undefined && val !== '')
                formDataa.append(key, val)
        }

        if (d.fileToUpload) formDataa.append('fileToUpload', d.fileToUpload)

        store.updateClient(props.update_dataId, formDataa)
            .then(() => {
                storeToast.successToast(t('settingsModule.client_updated'))
                handleSuccess()
            }).catch(error => {
                const message = error?.response?._data?.message
                    ?? error?.response?._data?.detail
                    ?? error?.response?._data?.errors
                    ?? error?.message
                    ?? t('error')
                storeToast.errorToast(String(message))
            })
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

watch(() => props.update_dataId, (id) => {
    if (id) {
        store.fetchClientOneData(id).then(res => {
            clientData.value = res.result
            nextTick(() => updateVisibility())
        })
    }
}, { immediate: true })

const handleFileChange = (event) => {
    const file = event.target.files[0]
    if (file) clientData.value.fileToUpload = file
}
</script>

<template>
    <VNavigationDrawer temporary :width="400" location="end" class="scrollable-content"
        :model-value="props.isDrawerOpen" @update:model-value="handleDrawerModelValueUpdate">

        <AppDrawerHeaderSection :title="$t('settingsModule.edit')" @cancel="closeNavigationDrawer" />

        <PerfectScrollbar :options="{ wheelPropagation: false }">
            <VCard flat>
                <VCardText>
                    <VForm ref="refForm" v-model="isFormValid" @submit.prevent="sendClientUpdate">
                        <VRow>

                            <!-- type client -->
                            <VCol cols="12" v-if="showTypeClient">
                                <AppSelect
                                    v-model="clientData.client_type"
                                    :label="$t('clients.type')"
                                    :rules="[requiredValidator]"
                                    :items="typeclient"
                                    :requireInput="true"
                                    item-value="value"
                                    item-title="label"
                                />
                            </VCol>

                            <!-- owner Name CN -->
                            <VCol cols="12">
                                <AppTextField
                                    v-model="clientData.cname"
                                    :rules="[requiredValidator]"
                                    :label="$t('clients.ownerNameCN')"
                                    :requireInput="true"
                                />
                            </VCol>

                            <!-- sname — Директор -->
                            <VCol cols="12" v-if="showSname">
                                <AppTextField
                                    v-model="clientData.sname"
                                    :label="$t('clients.sname')"
                                />
                            </VCol>

                            <!-- accname — Бухгалтер -->
                            <VCol cols="12" v-if="showAccname">
                                <AppTextField
                                    v-model="clientData.accname"
                                    :label="$t('clients.accname')"
                                />
                            </VCol>

                            <!-- description — Описание/Департамент (iABS) -->
                            <VCol cols="12" v-if="showDesc">
                                <AppTextField
                                    v-model="clientData.description"
                                    :label="$t('clients.description')"
                                />
                            </VCol>

                            <!-- job — Должность (iABS) -->
                            <VCol cols="12" v-if="showJob">
                                <AppTextField
                                    v-model="clientData.job"
                                    :label="$t('clients.job')"
                                />
                            </VCol>

                            <!-- city L -->
                            <VCol cols="12">
                                <AppTextField
                                    v-model="clientData.location"
                                    :label="$t('clients.cityL')"
                                    :requireInput="true"
                                    :rules="[requiredValidator]"
                                />
                            </VCol>

                            <!-- region S -->
                            <VCol cols="12">
                                <AppTextField
                                    v-model="clientData.state"
                                    :label="$t('clients.regionS')"
                                    :requireInput="true"
                                    :rules="[requiredValidator]"
                                />
                            </VCol>

                            <!-- country C -->
                            <VCol cols="12">
                                <AppTextField
                                    v-model="clientData.country"
                                    :label="$t('clients.countryC')"
                                    :requireInput="true"
                                    :rules="[requiredValidator]"
                                />
                            </VCol>

                            <!-- address STREET -->
                            <VCol cols="12">
                                <AppTextField
                                    v-model="clientData.address"
                                    :label="$t('clients.addressStreet')"
                                    :requireInput="true"
                                    :rules="[requiredValidator]"
                                />
                            </VCol>

                            <!-- email E -->
                            <VCol cols="12">
                                <AppTextField
                                    v-model="clientData.email"
                                    :label="$t('clients.emailAddressE')"
                                    :requireInput="true"
                                    :rules="[requiredValidator]"
                                />
                            </VCol>

                            <!-- organization O -->
                            <VCol cols="12">
                                <AppTextField
                                    v-model="clientData.organization"
                                    :label="$t('clients.organizationO')"
                                    :requireInput="true"
                                    :rules="[requiredValidator]"
                                />
                            </VCol>

                            <!-- org_unit OU -->
                            <VCol cols="12">
                                <AppTextField
                                    v-model="clientData.org_unit"
                                    :label="$t('clients.subdivisionOU')"
                                    :requireInput="true"
                                    :rules="[requiredValidator]"
                                />
                            </VCol>

                            <!-- inn -->
                            <VCol cols="12" v-if="showInn">
                                <AppTextField
                                    v-model="clientData.inn"
                                    :label="$t('clients.inn')"
                                    :requireInput="true"
                                    :rules="[requiredValidator]"
                                />
                            </VCol>

                            <!-- pinfl -->
                            <VCol cols="12" v-if="showPinfl">
                                <AppTextField
                                    v-model="clientData.pinfl"
                                    :label="$t('clients.personalIdentificationNumber')"
                                    :requireInput="true"
                                    :rules="[requiredValidator]"
                                />
                            </VCol>

                            <!-- phone -->
                            <VCol cols="12">
                                <AppTextField
                                    v-model="clientData.phone"
                                    :label="$t('clients.phoneNumber')"
                                    :requireInput="true"
                                    :rules="[requiredValidator]"
                                />
                            </VCol>

                            <!-- file upload -->
                            <VCol cols="12">
                                <label>{{ $t('clients.attachRequestFile') }}</label>
                                <div class="custom-file-upload">
                                    <label for="file-upload">
                                        <VIcon icon="tabler-upload" />
                                        <span id="file-name">{{ $t('clients.chooseFile') }}</span>
                                    </label>
                                    <input id="file-upload" type="file" hidden @change="handleFileChange" accept=".pdf">
                                </div>
                            </VCol>

                            <!-- Submit -->
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