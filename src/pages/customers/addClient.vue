<script setup>
import { useClient } from '@/@core/stores/client'
import { VForm } from 'vuetify/components/VForm'

const store = useClient()

const operators = ref([])

const loadOperators = async () => {
    try {
        const res = await $api('users/users/', { query: { page_size: 200 } })
        const payload = res?.data ?? res?.result ?? res
        const raw = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.results)
                ? payload.results
                : Array.isArray(payload?.data)
                    ? payload.data
                    : []
        operators.value = raw
            .filter(u => (u?.type ?? u?.role ?? '').toLowerCase() === 'operator')
            .map(u => ({
                value: u.id,
                label: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.username,
            }))
    }
    catch {
        operators.value = []
    }
}

onMounted(() => {
    loadOperators()
})

definePage({
    meta: {
        action: 'read',
        subject: 'AclDemo',
    }
})
const refForm = ref()

const clientData = ref({
    operator: null,
    cert_type: null,       // typeCert → cert_type (integer)
    type_client: null,     // typeClient → type_client
    local_code: '',

    cname: '',
    sname: '',
    fido_user_id: '',      // iabsID → fido_user_id
    password: '',
    location: '',
    state: '',
    country: 'UZ',
    address: '',
    email: '',
    organisation: '',      // organization → organisation
    phone: '',
    org_unit: '',          // ou → org_unit
    inn: '',
    pinfl: '',

    token_type: null,
    token_sn: '',          // token_serialnumber → token_sn
    csr: '',
    container: '',
    file_upload: null,     // fileToUpload → file_upload
})

const isInnRequired = computed(() => Number(clientData.value.type_client) === 1)
const isPinflRequired = computed(() => {
    const typeClient = Number(clientData.value.type_client)
    const certType = Number(clientData.value.cert_type)
    return typeClient === 2 || certType === 3
})

const innRule = value => {
    if (!isInnRequired.value)
        return true
    return String(value ?? '').trim().length > 0 || 'INN is required for legal person'
}

const pinflRule = value => {
    if (!isPinflRequired.value)
        return true
    return String(value ?? '').trim().length > 0 || 'PINFL is required for physical person or cert type 3'
}




// 'operator'          => ['nullable', 'string'],
//   'typeCert'          => ['nullable', 'string'],
//   'typeClient'        => ['nullable', 'string'],
//   'cert_type'         => ['nullable', 'string'],
//   'local_code'        => ['nullable', 'string'],

//   'cname'             => ['required', 'string', 'max:100'],
//   'sname'             => ['nullable', 'string', 'max:100'],
//   'iabsID'            => ['required', 'string'],
//   'password'          => ['required', 'string', 'min:8'],
//   'location'          => ['required', 'string'],
//   'state'             => ['required', 'string'],
//   'country'           => ['required', 'string'],
//   'address'           => ['required', 'string'],
//   'email'             => ['required', 'email', 'unique:clients,email'],
//   'organisation'      => ['required', 'string'],
//   'phone'             => ['required', 'numeric', 'digits:12'],
//   'ou'                => ['required', 'string'],
//   'inn'               => ['nullable', 'string'],
//   'pinfl'             => ['nullable', 'string'],

//   'accname'           => ['nullable', 'string'],
//   'job'               => ['nullable', 'string'],
//   'token_type'        => ['nullable', 'string'],
//   'token_sn'          => ['nullable', 'string'],
//   'token_serialnumber'=> ['nullable', 'string'],
//   'csr'               => ['nullable', 'string'],
//   'container'         => ['nullable', 'string'],
//   'fileToUpload'      => ['required', 'file', 'mimes:pdf', 'max:10240'],


const onSubmit = () => {
    refForm.value?.validate().then(({ valid }) => {
        if (!valid) return

        const formData = new FormData()
        const d = clientData.value

        const fields = [
            'operator', 'cert_type', 'type_client', 'local_code',
            'cname', 'sname', 'fido_user_id', 'password',
            'location', 'state', 'country', 'address', 'email',
            'organisation', 'phone', 'org_unit', 'inn', 'pinfl',
            'token_type', 'token_sn', 'csr', 'container',
        ]

        for (const key of fields) {
            const val = d[key]
            if (val !== null && val !== undefined && val !== '') {
                formData.append(key, val)
            }
        }

        if (d.file_upload) {
            const file = Array.isArray(d.file_upload) ? d.file_upload[0] : d.file_upload
            if (file) formData.append('file_upload', file)
        }

        store.createClients(formData)
    })
}

const token_type = [
    { value: 'ePass/iKey', label: 'ePass/iKey' },
    { value: 'virtual', label: 'Virtual token' },
    { value: 'smartcard', label: 'BST' },]






const typeClient = [
    { value: 1, label: 'Юридическое лицо' },
    { value: 2, label: 'Физическое лицо' },
]


const typeCert = [
    { value: 2, label: 'Интернет банкинг' },
    { value: 5, label: 'Мобильный банкинг Metin' },
    { value: 4, label: 'Мобильный банкинг iABS' },
    { value: 3, label: 'Мобильный банкинг PFX' },
    { value: 1, label: 'Пользователь iABS' },
]


</script>

<template>

    <VCard title="Add Client" class="py-6 px-6">
        <VForm ref="refForm" @submit.prevent="onSubmit">
            <VRow>

                <!-- fido_user_id (IABS ID)  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.fido_user_id" :rules="[requiredValidator]" label="IABS ID"
                        :requireInput="true" />
                </VCol>

                <!-- password -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.password"
                        label="Password"
                        type="password"
                        :requireInput="true"
                        :rules="[requiredValidator, minLengthValidator(clientData.password, 8)]"
                    />
                </VCol>

                <!-- operator  -->
                <VCol cols="12" md="6">
                    <AppSelect v-model="clientData.operator" label="Operator" :items="operators" item-title="label"
                        item-value="value" />
                </VCol>

                <!-- cert_type  -->
                <VCol cols="12" md="6">
                    <AppSelect v-model="clientData.cert_type" label="typeCert" :items="typeCert" item-title="label"
                        item-value="value" />
                </VCol>

                <!-- type_client -->
                <VCol cols="12" md="6">
                    <AppSelect v-model="clientData.type_client" label="typeClient" :items="typeClient" item-title="label"
                        item-value="value" />
                </VCol>


                <!-- cname -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.cname" :rules="[requiredValidator]" :requireInput="true"
                        label="Cname" />
                </VCol>

                <!-- city location  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.location" label="Location" :requireInput="true"
                        :rules="[requiredValidator]" />
                </VCol>

                <!-- country -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.country" :rules="[requiredValidator]" :requireInput="true"
                        label="Страна (двухбуквенный индекс) (C)" />
                </VCol>

                <!-- state  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.state" persistent-placeholder label="oblast"
                        :rules="[requiredValidator]" :requireInput="true" />
                </VCol>

                <!-- address  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.address" :rules="[requiredValidator]" :requireInput="true"
                        label="Address" />
                </VCol>

                <!-- email -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.email" :rules="[requiredValidator, emailValidator]"
                        :requireInput="true" label="Email" />
                </VCol>


                <!-- organisation  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.organisation" :rules="[requiredValidator]" :requireInput="true"
                        label="Organisation" />
                </VCol>


                <!-- org_unit  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.org_unit" label="organisation OU" :requireInput="true"
                        :rules="[requiredValidator]" />
                </VCol>

                <!-- inn -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.inn"
                        label="INN"
                        :requireInput="isInnRequired"
                        :rules="[innRule]"
                    />
                </VCol>

                <!-- pinfl -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.pinfl"
                        label="PINFL"
                        :requireInput="isPinflRequired"
                        :rules="[pinflRule]"
                    />
                </VCol>

                <!-- phone  -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.phone"
                        :rules="[requiredValidator, minLengthValidator(clientData.phone, 12)]" label="Phone"
                        :requireInput="true" type="number" />
                </VCol>

                <!-- type token  -->
                <VCol cols="12" md="6">
                    <AppSelect v-model="clientData.token_type" label="type token" item-title="label" item-value="value"
                        :items="token_type" />
                </VCol>

                <!-- token_sn -->
                <VCol cols="12" md="6">
                    <AppTextField v-model="clientData.token_sn" label="token_serialnumber"
                        append-inner-icon="tabler-dots-vertical" :requireInput="false" />
                </VCol>





                <!-- file upload  -->
                <VCol cols="12" md="6">
                    <label>Прикрепить файл запроса<span class="asterisk">*</span>
                    </label>
                    <VFileInput v-model="clientData.file_upload" color="primary" variant="outlined"
                        :rules="[requiredValidator]" accept=".pdf" />
                </VCol>

                <VCol cols="12">
                    <VBtn type="submit">
                        Submit
                    </VBtn>
                </VCol>
            </VRow>
        </VForm>
    </VCard>
</template>


<style lang="scss">
.custom-file-upload {
    // border: 2px solid #d1d5db;
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
    padding: 9px;
}

.asterisk {
    color: #ea5455;
}
</style>
