<script setup>
import { useClient } from '@/@core/stores/client'
import { useToast } from '@/@core/stores/toastConfig'
import { useTokenSN } from '@/@core/composable/useTokenSN'
import { useI18n } from 'vue-i18n'
import { VForm } from 'vuetify/components/VForm'
import { $api } from "@/utils/api";
import PhoneInput from '@/components/clients/PhoneInput.vue'

const { t } = useI18n()
const store = useClient()
const storetoast = useToast()
const operators = ref([])
const refForm = ref()
const serverErrors = ref({})

const userData = useCookie('userData')
const isAdmin = computed(() => userData.value?.role === 'admin')

// --- clientData ---
const clientData = ref({
    operator: null,
    cert_type: null,
    type_client: null,
    local_code: '',
    cname: '',
    sname: '',
    accname: '',
    description: '',
    job: '',
    fido_user_id: '',
    location: '',
    state: '',
    country: 'UZ',
    address: '',
    email: '',
    organisation: '',
    phone: '',
    org_unit: '',
    inn: '',
    pinfl: '',
    token_type: null,
    token_sn: '',
    csr: '',
    container: '',
    file_upload: null,
})

// --- composable ---
const { getTokenSN, loading: tokenLoading } = useTokenSN(clientData)

// --- visibility ---
const showSname       = ref(false)
const showAccname     = ref(false)
const showDesc        = ref(false)
const showJob         = ref(false)
const showInn         = ref(false)
const showPinfl       = ref(false)
const showTokenType   = ref(true)
const showTokenSN     = ref(true)
const showTypeClient  = ref(true)

const updateVisibility = () => {
    const ct = Number(clientData.value.cert_type)
    const tc = Number(clientData.value.type_client)
    const tt = clientData.value.token_type

    const isMobile = [2, 4].includes(ct)
    const isIABS   = ct === 3

    showTokenType.value   = !isMobile
    showTokenSN.value     = !isMobile && tt !== 'virtual'
    showTypeClient.value  = !isIABS

    if (isIABS) {
        // Пользоват iABS: описание, должнсть, пинфл — исовано
        showSname.value   = false
        showAccname.value = false
        showDesc.value    = true
        showJob.value     = true
        showInn.value     = false
        showPinfl.value   = true
    } else {
        // Интрет банкиг + Моилный: ИН/ПИФЛ заисит от тпа лиента
        showSname.value   = true
        showAccname.value = true
        showDesc.value    = false
        showJob.value     = false
        if (!tc) {
            // Тп клента не выбран — поазать оба
            showInn.value   = true
            showPinfl.value = true
        } else {
            showInn.value   = tc === 1   // Юриическое лцо → ИН
            showPinfl.value = tc === 2   // Фзичкое лцо   ПИФЛ
        }
    }
}

// --- OU prefix map (совпадае с PHP лгикой) ---
const OU_MAP = {
    2: 'UZC012',   // mobile iABS
    1: 'UZB012',   // iABS user
    3: 'UZC012',   // mobile PFX
    4: 'UZC012',   // mobile PFX alt
    7: 'UZM012',   // Metin
    5: 'UZJ012',   // JOYDA
    6: 'UZS012',   // CROBS
}

// Вычияет org_unit разу при измнени fido_user_id л cert_type
const computeOrgUnit = () => {
    const certType = clientData.value.cert_type
    const fidoId   = clientData.value.fido_user_id
    const prefix   = OU_MAP[Number(certType)] ?? ''
    if (prefix && fidoId) {
        clientData.value.org_unit = prefix + String(fidoId).padStart(9, '0')
    }
}

// --- fetchClientInfo ---
const fetchClientInfo = async () => {
    const fidoId  = clientData.value.fido_user_id
    const certType = clientData.value.cert_type
    if (!fidoId || !certType) return

	resetClientInfoFields()

    try {
        const res = await $api(`clients/${fidoId}/info/${certType}/iabs`)

        const isMobile = [2, 4].includes(Number(certType))
        const isIABS   = Number(certType) === 3

        const clean = str => str ? str.replace(/[^a-zA-Z0-9 а-яА-ЯЁё]/g, '').trim() : ''

        if (isMobile && res?.data?.user) {
            const u = res.data.user
            clientData.value.cname    = u.fio     ?? clientData.value.cname
            clientData.value.email    = u.email   ?? clientData.value.email
            clientData.value.location = u.city    ?? clientData.value.location
            clientData.value.state    = u.region  ?? clientData.value.state
            clientData.value.country  = u.country ?? clientData.value.country
            clientData.value.address  = u.address ?? clientData.value.address
            clientData.value.inn      = u.inn     ?? clientData.value.inn
            clientData.value.pinfl    = u.pinfl   ?? clientData.value.pinfl
            clientData.value.phone    = u.phone   ?? clientData.value.phone
        } else {
            if (res?.userName)      clientData.value.cname        = clean(res.userName)
            if (res?.directorName)  clientData.value.sname        = clean(res.directorName)
            if (res?.email)  		clientData.value.email        = res.email
            if (res?.accounterName) clientData.value.accname      = clean(res.accounterName)
            if (res?.location)      clientData.value.location     = clean(res.location)
            if (res?.region)        clientData.value.state        = clean(res.region)
            if (res?.address)       clientData.value.address      = clean(res.address)
            if (res?.company)       clientData.value.organisation = clean(res.company)
            if (res?.country)       clientData.value.country      = res.country
            if (res?.inn)           clientData.value.inn          = res.inn
            if (res?.pinfl)         clientData.value.pinfl        = res.pinfl
            if (res?.mobilePhone)   clientData.value.phone        = res.mobilePhone
            if (res?.localCode)     clientData.value.local_code   = res.localCode

            // обильный банкнг PFX / iABS — имя из login
            if ([3, 4].includes(Number(certType))) {
                if (res?.login)        clientData.value.cname = clean(res.login)
                if (res?.directorName) clientData.value.sname = clean(res.directorName)
            }

            // Ползоель iABS — пиаие и олжност из description
            if (isIABS) {
                if (res?.userName) clientData.value.cname = clean(res.userName)
                if (res?.description) {
                    const arr = res.description.split(',')
                    clientData.value.description  = clean((arr[0] ?? '').replace('Департамент:', ''))
                    clientData.value.job          = clean((arr[1] ?? '').replace('лжноть:', ''))
                    clientData.value.organisation = clean((arr[1] ?? '').replace('Дожность:', ''))
                }
            }
        }
    } catch (err) {
        console.error('fetchClientInfo error:', err)
    }
}

// --- watchers ---
let infoDebounce = null

watch(() => clientData.value.fido_user_id, () => {
    computeOrgUnit()
    if (infoDebounce) clearTimeout(infoDebounce)
    infoDebounce = setTimeout(() => fetchClientInfo(), 500)
})

watch(() => clientData.value.cert_type, () => {
    computeOrgUnit()
    fetchClientInfo()
    updateVisibility()
})

watch(() => clientData.value.type_client, (newVal) => {
    // Для физческго лица — Location = Address (ка в PHP)
    if (Number(newVal) === 2 && clientData.value.address) {
        clientData.value.location = clientData.value.address
    }
    updateVisibility()
})

watch(() => clientData.value.token_type, () => updateVisibility())

watch(clientData, (newVal, oldVal) => {
    Object.keys(serverErrors.value).forEach(field => {
        if (newVal[field] !== oldVal[field])
            serverErrors.value[field] = undefined
    })
}, { deep: true })

// --- validation rules ---
const isInnRequired   = computed(() => Number(clientData.value.type_client) === 1)
const isPinflRequired = computed(() => {
    const tc = Number(clientData.value.type_client)
    const ct = Number(clientData.value.cert_type)
    return tc === 2 || ct === 1
})

const innRule   = v => !isInnRequired.value   || String(v ?? '').trim().length > 0 || 'INN majburiy'
const pinflRule = v => !isPinflRequired.value || String(v ?? '').trim().length > 0 || 'PINFL majburiy'

// --- token SN ---
const handleGetTokenSN = async () => {
    try {
        await getTokenSN(clientData.value.token_type || 'ePass/iKey')
        storetoast.successToast(t('clients.token_sn_received'))
    } catch (err) {
        if (err?.type === 'check_cert') {
            for (const sn of err.certSnArr) {
                try {
                    const res = await $api('certificates/check/', {
                        method: 'POST',
                        body: { cert_sn: sn },
                    })
                    if (res?.[0]?.status === 1) {
                        storetoast.errorToast(t('clients.cert_must_be_revoked'))
                        return
                    }
                } catch {}
            }
            await handleGetTokenSN()
        } else if (err?.message === 'fill_fields') {
            storetoast.errorToast(t('clients.fill_required_fields'))
        } else if (err?.message === 'ws_error') {
            storetoast.errorToast(t('clients.ws_connection_error'))
        } else {
            storetoast.errorToast(err?.message || t('error'))
        }
    }
}

// --- operators ---
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
    } catch {
        operators.value = []
    }
}

onMounted(() => loadOperators())

definePage({
    meta: { action: 'read', subject: 'AclDemo' }
})

// --- submit ---
const onSubmit = () => {
    refForm.value?.validate().then(({ valid }) => {
        if (!valid) return
        serverErrors.value = {}

        const formData = new FormData()
        const d = clientData.value
        const isIABS = Number(d.cert_type) === 3   // iABS user

        const fields = [
            'operator', 'cert_type', 'type_client', 'local_code',
            'cname', 'sname', 'accname', 'description', 'job', 'fido_user_id',
            'location', 'state', 'country', 'address', 'email',
            'organisation', 'phone', 'org_unit', 'inn', 'pinfl',
            'token_type', 'token_sn', 'csr', 'container',
        ]

        for (const key of fields) {
	        //if (key === 'inn' && isIABS) continue
        
            const val = d[key]
            if (val !== null && val !== undefined && val !== '')
                formData.append(key, val)
        }

        if (d.file_upload) {
            const file = Array.isArray(d.file_upload) ? d.file_upload[0] : d.file_upload
            if (file) formData.append('file_upload', file)
        }

        store.createClients(formData)
            .then(res => {
                storetoast.successToast(t('settingsModule.client_created'))
                const clientId = res?.id
                const cert = res?.cert
                if (isAdmin.value && clientId && cert?.cert_sn) {
                    $router.push({
                        path: '/customers/clientCreated',
                        query: {
                            clientId: String(clientId),
                            certSn: cert.cert_sn,
                            tokenSn: cert.token_sn || '',
                            deviceType: cert.device_type || '',
                        },
                    })
                } else {
                    $router.push('/customers')
                }
            })
            .catch(err => {
                const errData = err?.data ?? err?.response?._data ?? {}
                const errors = errData?.error ?? errData ?? {}
                if (typeof errors === 'object' && !Array.isArray(errors)) {
                    const msgs = Object.values(errors).flat().map(v => String(v))
                    const hasExistsError = msgs.some(m =>
                        m.toLowerCase().includes('already exists') ||
                        m.toLowerCase().includes('mavjud')
                    )
                    if (hasExistsError || !msgs.length) {
                        storetoast.errorToast(msgs[0] || t('error'))
                    } else {
                        serverErrors.value = Object.fromEntries(
                            Object.entries(errors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
                        )
                    }
                } else {
                    storetoast.errorToast(String(errors) || t('error'))
                }
            })
    })
}

// Backenddan to'ldiriladigan maydonlarni bo'shatish
const resetClientInfoFields = () => {
    clientData.value.cname        = ''
    clientData.value.sname        = ''
    clientData.value.accname      = ''
    clientData.value.description  = ''
    clientData.value.job          = ''
    clientData.value.location     = ''
    clientData.value.state        = ''
    clientData.value.country      = 'UZ'   // boshlang'ich qiymat
    clientData.value.address      = ''
    clientData.value.email        = ''
    clientData.value.organisation = ''
    clientData.value.phone        = ''
    clientData.value.inn          = ''
    clientData.value.pinfl        = ''
    clientData.value.local_code   = ''
}

const token_type = computed(() => [
    { value: 'ePass/iKey', label: t('clients.token_epass') },
    { value: 'virtual',    label: t('clients.token_virtual') },
    { value: 'smartcard',  label: t('clients.token_bst') },
])

const typeClient = computed(() => [
    { value: 1, label: t('clients.legal_person') },
    { value: 2, label: t('clients.physical_person') },
])

const typeCert = computed(() => [
    { value: 1, label: t('clients.internet_banking') },
    { value: 4, label: t('clients.mobile_banking_pfx') },
    { value: 3, label: t('clients.iabs_user') },
])

</script>

<template>
    <VCard :title="$t('clients.add_client')" class="py-6 px-6">
        <VForm ref="refForm" @submit.prevent="onSubmit">
            <VRow>

                <!-- IABS ID -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.fido_user_id"
                        type="number"
                        :rules="[requiredValidator]"
                        :label="$t('clients.iabs_id')"
                        :requireInput="true"
                        :error-messages="serverErrors.fido_user_id"
                    />
                </VCol>

                <!-- cert_type -->
                <VCol cols="12" md="6">
                    <AppSelect
                        v-model="clientData.cert_type"
                        :label="$t('clients.cert_type')"
                        :items="typeCert"
                        item-title="label"
                        item-value="value"
                        :error-messages="serverErrors.cert_type"
                    />
                </VCol>

                <!-- type_client -->
                <VCol cols="12" md="6" v-if="showTypeClient">
                    <AppSelect
                        v-model="clientData.type_client"
                        :label="$t('clients.client_type')"
                        :items="typeClient"
                        item-title="label"
                        item-value="value"
                        :error-messages="serverErrors.type_client"
                    />
                </VCol>

                <!-- operator -->
                <VCol cols="12" md="6">
                    <AppSelect
                        v-model="clientData.operator"
                        :label="$t('clients.operator')"
                        :items="operators"
                        item-title="label"
                        item-value="value"
                        :error-messages="serverErrors.operator"
                    />
                </VCol>

                <!-- cname -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.cname"
                        :rules="[requiredValidator]"
                        :requireInput="true"
                        :label="$t('clients.cname')"
                        :error-messages="serverErrors.cname"
                    />
                </VCol>

                <!-- sname  Директор (б + обильный) -->
                <VCol cols="12" md="6" v-if="showSname">
                    <AppTextField
                        v-model="clientData.sname"
                        :label="$t('clients.sname')"
                        :error-messages="serverErrors.sname"
                    />
                </VCol>

                <!-- accname  Бухгалт (и + мобильный) -->
                <VCol cols="12" md="6" v-if="showAccname">
                    <AppTextField
                        v-model="clientData.accname"
                        :label="$t('clients.accname')"
                        :error-messages="serverErrors.accname"
                    />
                </VCol>

                <!-- description — исаи/Департамент (iABS) -->
                <VCol cols="12" md="6" v-if="showDesc">
                    <AppTextField
                        v-model="clientData.description"
                        :label="$t('clients.description')"
                        :error-messages="serverErrors.description"
                    />
                </VCol>

                <!-- job  Должность (iABS) -->
                <VCol cols="12" md="6" v-if="showJob">
                    <AppTextField
                        v-model="clientData.job"
                        :label="$t('clients.job')"
                        :error-messages="serverErrors.job"
                    />
                </VCol>

                <!-- location -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.location"
                        :label="$t('clients.location')"
                        :requireInput="true"
                        :rules="[requiredValidator]"
                        :error-messages="serverErrors.location"
                    />
                </VCol>

                <!-- state -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.state"
                        :label="$t('clients.state')"
                        :rules="[requiredValidator]"
                        :requireInput="true"
                        :error-messages="serverErrors.state"
                    />
                </VCol>

                <!-- country -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.country"
                        :rules="[requiredValidator]"
                        :requireInput="true"
                        :label="$t('clients.country')"
                        :error-messages="serverErrors.country"
                    />
                </VCol>

                <!-- address -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.address"
                        :rules="[requiredValidator]"
                        :requireInput="true"
                        :label="$t('clients.address')"
                        :error-messages="serverErrors.address"
                    />
                </VCol>

                <!-- email -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.email"
                        :rules="[requiredValidator, emailValidator]"
                        :requireInput="true"
                        :label="$t('clients.email')"
                        :error-messages="serverErrors.email"
                    />
                </VCol>

                <!-- organisation -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.organisation"
                        :rules="[requiredValidator]"
                        :requireInput="true"
                        :label="$t('clients.organisation')"
                        :error-messages="serverErrors.organisation"
                    />
                </VCol>

                <!-- org_unit -->
                <VCol cols="12" md="6">
                    <AppTextField
                        v-model="clientData.org_unit"
                        :label="$t('clients.org_unit')"
                        :requireInput="true"
                        :rules="[requiredValidator]"
                        :error-messages="serverErrors.org_unit"
                    />
                </VCol>

                <!-- inn -->
                <VCol cols="12" md="6" v-if="showInn">
                    <AppTextField
                        v-model="clientData.inn"
                        :label="$t('clients.inn')"
                        :requireInput="isInnRequired"
                        :rules="[innRule]"
                        :error-messages="serverErrors.inn"
                    />
                </VCol>

                <!-- pinfl -->
                <VCol cols="12" md="6" v-if="showPinfl">
                    <AppTextField
                        v-model="clientData.pinfl"
                        :label="$t('clients.pinfl')"
                        :requireInput="isPinflRequired"
                        :rules="[pinflRule]"
                        :error-messages="serverErrors.pinfl"
                    />
                </VCol>

                <VCol cols="12" md="6">
                    <PhoneInput
                        v-model="clientData.phone"
                        :label="$t('clients.phone')"
                        :requireInput="true"
                        :error-messages="serverErrors.phone"
                    />
                </VCol>

                <!-- token_type -->
                <VCol cols="12" md="6" v-if="showTokenType">
                    <AppSelect
                        v-model="clientData.token_type"
                        :label="$t('clients.token_type')"
                        item-title="label"
                        item-value="value"
                        :items="token_type"
                        :error-messages="serverErrors.token_type"
                    />
                </VCol>

                <!-- token_sn -->
                <VCol cols="12" md="6" v-if="showTokenSN">
                    <AppTextField
                        v-model="clientData.token_sn"
                        :label="$t('clients.token_sn')"
                        :requireInput="true"
                        readonly
                        :error-messages="serverErrors.token_sn"
                    >
                        <template #append-inner>
                            <VBtn
                                icon
                                variant="text"
                                size="small"
                                :loading="tokenLoading"
                                @click="handleGetTokenSN"
                            >
                                <VIcon icon="tabler-antenna" size="20" />
                                <VTooltip activator="parent" location="top">
                                    {{ $t('clients.get_token_sn') }}
                                </VTooltip>
                            </VBtn>
                        </template>
                    </AppTextField>
                </VCol>

                <!-- file upload -->
                <VCol cols="12" md="6">
                    <label>
                        {{ $t('clients.file_upload') }}
                        <span class="asterisk">*</span>
                    </label>
                    <VFileInput
                        v-model="clientData.file_upload"
                        color="primary"
                        variant="outlined"
                        :rules="[requiredValidator]"
                        accept=".pdf"
                        :error-messages="serverErrors.file_upload"
                    />
                </VCol>

                <!-- buttons -->
                <VCol cols="12" class="d-flex justify-end">
                    <VBtn variant="outlined" class="mr-3" @click="$router.back()">
                        <VIcon size="18" icon="tabler-arrow-left" class="mr-1" />
                        {{ $t('back') }}
                    </VBtn>
                    <VBtn type="submit">
                        {{ $t('settingsModule.send') }}
                    </VBtn>
                </VCol>

            </VRow>
        </VForm>
    </VCard>
</template>

<style lang="scss">
.asterisk { color: #ea5455; }
</style>