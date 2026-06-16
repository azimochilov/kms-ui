<script setup>
import { useClient } from '@/@core/stores/client'
import { useToast } from '@/@core/stores/toastConfig'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { $api } from '@/utils/api'

const { t } = useI18n()
const route = useRoute()
const store = useClient()
const storetoast = useToast()

definePage({
    meta: { action: 'read', subject: 'AclDemo' },
})

const clientId = route.query.clientId
const certSn   = route.query.certSn
const tokenSn  = route.query.tokenSn
const deviceType = route.query.deviceType

const clientData = ref(null)
const certData   = ref(null)
const loading    = ref(true)
const writing    = ref(false)

const canWriteToToken = computed(() =>
    certSn &&
    tokenSn &&
    deviceType &&
    !['mobile', 'virtual'].includes(deviceType)
)

onMounted(async () => {
    try {
        const res = await store.fetOneClient(clientId)
        clientData.value = res?.result ?? res

        if (certSn) {
            const certRes = await $api(`certificates/${certSn}/`)
            certData.value = certRes?.data ?? certRes
        }
    } catch (err) {
        storetoast.errorToast(t('error'))
    } finally {
        loading.value = false
    }
})

const writeToToken = async () => {
    if (!certData.value) {
        storetoast.errorToast(t('certificates.messages.pfx_not_found'))
        return
    }

    const pfxOrBase64 = deviceType === 'smartcard'
        ? certData.value.base64
        : certData.value.pfx

    if (!pfxOrBase64) {
        storetoast.errorToast(t('certificates.messages.pfx_not_found'))
        return
    }

    writing.value = true
    const ws = new WebSocket('ws://localhost:8181')

    ws.onopen = () => {
        ws.send(JSON.stringify({
            function: 'importCert',
            token_sn: tokenSn,
            obj: pfxOrBase64,
            token_type: deviceType,
        }))
    }

    ws.onmessage = async (evt) => {
        const res = JSON.parse(evt.data)
        if (res.status === 'success') {
            try {
                await $api(`certificates/imported/${certSn}/`, { method: 'POST' })
                storetoast.successToast(t('certificates.messages.written_to_token'))
                setSopin()
            } catch {
                storetoast.errorToast(t('certificates.messages.ws_error'))
                writing.value = false
            }
        } else {
            if (res.comments === 'check cert') {
                storetoast.errorToast(t('certificates.messages.must_be_revoked'))
            } else {
                storetoast.errorToast(res.comments)
            }
            writing.value = false
        }
        ws.close()
    }

    ws.onerror = () => {
        storetoast.errorToast(t('certificates.messages.ws_error'))
        writing.value = false
    }

    ws.onclose = () => {
        writing.value = false
    }
}

const setSopin = () => {
    const ws = new WebSocket('ws://localhost:8181')

    ws.onopen = () => {
        ws.send(JSON.stringify({
            function: 'setSopin',
            token_sn: tokenSn,
            cert_sn: certSn,
        }))
    }

    ws.onmessage = async (evt) => {
        const res = JSON.parse(evt.data)
        if (res.status === 'success') {
            try {
                await $api('certificates/set-token-password/', {
                    method: 'POST',
                    body: { cert_sn: certSn, password: res.password },
                })
            } catch (err) {
                console.error('set-token-password error:', err)
            }
        } else {
            storetoast.errorToast(res.comments)
        }
    }

    ws.onerror = () => {
        storetoast.errorToast(t('certificates.messages.ws_error'))
    }
}

const infoRows = computed(() => {
    const c = clientData.value
    if (!c) return []
    return [
        { label: t('clients.cname'),        value: c.cname },
        { label: t('clients.sname'),        value: c.sname },
        { label: t('clients.accname'),      value: c.accname },
        { label: t('clients.organisation'), value: c.organisation },
        { label: t('clients.org_unit'),     value: c.org_unit },
        { label: t('clients.email'),        value: c.email },
        { label: t('clients.phone'),        value: c.phone },
        { label: t('clients.location'),     value: c.location },
        { label: t('clients.state'),        value: c.state },
        { label: t('clients.country'),      value: c.country },
        { label: t('clients.address'),      value: c.address },
        { label: t('clients.inn'),          value: c.inn },
        { label: t('clients.pinfl'),        value: c.pinfl },
    ].filter(r => r.value)
})

const certRows = computed(() => {
    const cert = clientData.value?.certificates?.[0]
    if (!cert && !certSn) return []
    return [
        { label: t('certificates.certificate_serial_number'), value: cert?.cert_sn ?? certSn },
        { label: t('certificates.token_serial_number'),       value: cert?.token_sn ?? tokenSn },
        { label: t('certificates.from_date'),                 value: cert?.cert_from },
        { label: t('certificates.to_date'),                   value: cert?.cert_to },
    ].filter(r => r.value)
})
</script>

<template>
    <VCard :title="$t('clients.add_client')" class="py-6 px-6">
        <VProgressLinear v-if="loading" indeterminate color="primary" />

        <template v-if="!loading && clientData">
            <!-- Client info -->
            <VCardSubtitle class="text-h6 mb-4 mt-2">
                <VIcon icon="tabler-user" class="mr-1" />
                {{ $t('clients.client_info') }}
            </VCardSubtitle>

            <VRow class="mb-4">
                <VCol
                    v-for="row in infoRows"
                    :key="row.label"
                    cols="12"
                    md="6"
                >
                    <div class="d-flex gap-2">
                        <span class="text-medium-emphasis">{{ row.label }}:</span>
                        <span class="font-weight-medium">{{ row.value }}</span>
                    </div>
                </VCol>
            </VRow>

            <!-- Certificate info -->
            <template v-if="certRows.length">
                <VDivider class="mb-4" />
                <VCardSubtitle class="text-h6 mb-4">
                    <VIcon icon="tabler-file-certificate" class="mr-1" />
                    {{ $t('clients.client_certificates') }}
                </VCardSubtitle>

                <VRow class="mb-6">
                    <VCol
                        v-for="row in certRows"
                        :key="row.label"
                        cols="12"
                        md="6"
                    >
                        <div class="d-flex gap-2">
                            <span class="text-medium-emphasis">{{ row.label }}:</span>
                            <span class="font-weight-medium">{{ row.value }}</span>
                        </div>
                    </VCol>
                </VRow>
            </template>

            <VAlert
                v-else
                type="warning"
                variant="tonal"
                class="mb-4"
            >
                {{ $t('certificates.messages.pfx_not_found') }}
            </VAlert>
        </template>

        <!-- Action buttons -->
        <VDivider class="mt-2 mb-4" />
        <div class="d-flex justify-end gap-3">
            <VBtn
                variant="outlined"
                @click="$router.push('/customers')"
            >
                <VIcon size="18" icon="tabler-arrow-left" class="mr-1" />
                {{ $t('back') }}
            </VBtn>

            <VBtn
                v-if="canWriteToToken"
                color="primary"
                :loading="writing"
                prepend-icon="tabler-usb"
                @click="writeToToken"
            >
                {{ $t('certificates.actions.write_to_token') }}
            </VBtn>
        </div>
    </VCard>
</template>
