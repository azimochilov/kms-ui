<script setup>
import { $api } from "@/utils/api";
import { useCertificate } from '@/@core/stores/certicate'
import { useToast } from '@/@core/stores/toastConfig'
import EditClient from '@/components/clients/EditClient.vue'
import DeleteDialog from "@/components/DeleteDialog.vue"
import RevokeDialog from "@/components/certificates/RevokeDialog.vue"
import ReissueDialog from '@/components/certificates/ReissueDialog.vue'

import { useI18n } from 'vue-i18n'
import { VDataTable } from 'vuetify/labs/VDataTable'

const { t } = useI18n()

definePage({
    meta: {
        action: 'read',
        subject: 'cert',
    }
})

const reissueDialog = ref(false)
const selectedReissueItem = ref(null)
const storetoast = useToast()
const store = useCertificate()
const userData = useCookie('userData')
const isAdmin = computed(() => userData.value?.role === 'admin')

// --- table options ---
const options = ref({ page: 1, itemsPerPage: 10, sortBy: [''], sortDesc: [false] })
const load = ref(true)
const status = ref(null)
const searchQuery = ref('')
const isAddNewUserDrawerVisible = ref(false)
const updateDataId = ref(null)
let searchDebounceTimer = null

// --- revoke dialog ---
const revokeDialog = ref(false)
const selectedCertSn = ref(null)

const openRevokeDialog = (item) => {
    selectedCertSn.value = item.cert_sn
    revokeDialog.value = true
}

const onRevoked = () => {
    refresh()
}

// --- delete dialog (eski, hozircha saqlab qo'yamiz) ---
const deleteDialog = ref(false)
const itemId = ref(null)

const deleteItemConfirm = () => {
    console.log('deleteItemConfirm')
}

// --- headers ---
const headers = computed(() => [
    { title: '№', key: 'id' },
    { title: t('certificates.owner_name'), key: 'cname' },
    { title: t('certificates.token_serial_number'), key: 'token_sn' },
    { title: t('certificates.certificate_serial_number'), key: 'cert_sn' },
    { title: t('certificates.from_date'), key: 'cert_from' },
    { title: t('certificates.to_date'), key: 'cert_to' },
    { title: t('certificates.status'), key: 'status' },
    { title: t('settingsModule.action'), key: 'actions' },
])

// --- status filter ---
const statuFilterData = computed(() => [
    { value: 4, label: t('certificates.statuses.installed') },
    { value: 3, label: t('certificates.statuses.updated') },
    { value: 0, label: t('certificates.statuses.revoked') },
])

const normalizeStatusFilter = value => {
    const normalizedValue = typeof value === 'object' && value !== null
        ? (value.value ?? value.id ?? value.title ?? value)
        : value

    if (normalizedValue === null || normalizedValue === undefined || normalizedValue === '')
        return null

    const parsed = Number(normalizedValue)

    return Number.isFinite(parsed) ? parsed : null
}

const statusReport = computed(() => {
    const report = store.certificates?.status_report ?? {}

    return {
        active: Number(report.active ?? 0),
        updated: Number(report.updated ?? 0),
        rejected: Number(report.rejected ?? 0),
        total: Number(report.total ?? 0)
            || Number(report.active ?? 0) + Number(report.updated ?? 0) + Number(report.rejected ?? 0),
    }
})

const statusText = (statusValue) => {
    const map = {
        4: { class: 'active', key: 'certificates.statuses.installed' },
        3: { class: 'history', key: 'certificates.statuses.updated' },
        2: { class: 'active', key: 'certificates.statuses.pfx_ready' },
        1: { class: 'active', key: 'certificates.statuses.token_ready' },
        0: { class: 'error', key: 'certificates.statuses.revoked' },
    }

    const found = map[statusValue]
    if (found) return { class: found.class, text: t(found.key) }

    return { class: '', text: String(statusValue ?? '-') }
}

// --- server tomonli ma'lumot (klient filtri olib tashlandi) ---
const tableData = computed(() => store.certificates?.data ?? [])

const totalPages = computed(() => {
    const total = Number(store.certificates?.pagination?.total ?? 0)
    const perPage = Number(options.value.itemsPerPage)
    if (perPage <= 0)
        return 1

    return Math.max(1, Math.ceil(total / perPage))
})

// --- refresh: backendga search/status/page/per_page yuboradi ---
const refresh = () => {
    load.value = true
    store.fetchStatusReport(options.value.itemsPerPage, options.value.page, {
        search: searchQuery.value,
        status: normalizeStatusFilter(status.value),
    })
        .then(() => {
            load.value = false
        })
        .catch(error => {
            if (error?.response?.status >= 500) {
                storetoast.errorToast('server xatoligi')
            } else {
                const msg = error?.response?._data?.message
                    ?? error?.response?._data?.detail
                    ?? error?.message
                    ?? t('error')
                storetoast.errorToast(String(msg))
            }
            load.value = false
        })
}

onMounted(() => refresh())

onBeforeUnmount(() => {
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer)
        searchDebounceTimer = null
    }
})

// --- watchers: har bir o'zgarishda backendga murojat ---
watch(() => options.value.itemsPerPage, newValue => {
    if (!Number.isFinite(Number(newValue)))
        return
    if (options.value.page !== 1) {
        options.value.page = 1
        return
    }
    refresh()
})

watch(() => options.value.page, newValue => {
    if (!newValue)
        return
    refresh()
})

watch(status, newValue => {
    const normalized = normalizeStatusFilter(newValue)
    if (newValue !== normalized) {
        status.value = normalized
        return
    }
    if (options.value.page !== 1) {
        options.value.page = 1
        return
    }
    refresh()
})

watch(searchQuery, () => {
    if (searchDebounceTimer)
        clearTimeout(searchDebounceTimer)

    searchDebounceTimer = setTimeout(() => {
        if (options.value.page !== 1) {
            options.value.page = 1
            return
        }
        refresh()
    }, 350)
})

const onItemsPerPageChange = value => {
    const normalizedValue = typeof value === 'object' && value !== null
        ? (value.value ?? value.id ?? value.title ?? value)
        : value

    const parsed = Number(normalizedValue)
    if (Number.isFinite(parsed)) {
        options.value.itemsPerPage = parsed
        return
    }

    if (String(normalizedValue).toLowerCase() === 'all')
        options.value.itemsPerPage = -1
}

const itemsPerPageOptions = computed(() => [
    { value: 10, title: '10' },
    { value: 25, title: '25' },
    { value: 50, title: '50' },
    { value: 100, title: '100' },
    { value: -1, title: t('clients.all') },
])

// --- helpers ---
const getRowProps = (item) => {
    if (!item) return {}
    if (item.id === 1) return 'green-row'
    return {}
}

const downloadPDF = async (item) => {
    try {
        const response = await $api(`certificates/${item.id}/pdf/`, {
            responseType: 'blob',
        })

        const blob = new Blob([response], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${item.cert_sn}.pdf`
        link.click()
        URL.revokeObjectURL(url)
    } catch (err) {
        storetoast.errorToast(t('tokenModule.upload_error'))
    }
}

const updateItem = (item) => {
    selectedReissueItem.value = item
    reissueDialog.value = true
}

const onReissued = () => {
    refresh()
}

// Tokenga yozish — WebSocket orqali
const writeToToken = async (item) => {
    let certData

    const res = await $api(`certificates/${item.cert_sn}/`)
    const data = res?.data ?? res
    certData = item.device_type === 'smartcard' ? data.base64 : data.pfx

    if (!certData) {
        storetoast.errorToast(t('certificates.messages.pfx_not_found'))
        return
    }

    const ws = new WebSocket('ws://localhost:8181')

    ws.onopen = () => {
        ws.send(JSON.stringify({
            function: 'importCert',
            token_sn: item.token_sn,
            obj: certData,
            token_type: item.device_type,
        }))
    }

    ws.onmessage = async (evt) => {
        const res = JSON.parse(evt.data)
        if (res.status === 'success') {
            try {
                await $api(`certificates/imported/${item.cert_sn}/`, { method: 'POST' })
                storetoast.successToast(t('certificates.messages.written_to_token'))
                setSopin(item)
            } catch {
                storetoast.errorToast(t('certificates.messages.ws_error'))
            }
        } else {
            if (res.comments === 'check cert') {
                storetoast.errorToast(t('certificates.messages.must_be_revoked'))
            } else {
                storetoast.errorToast(res.comments)
            }
        }
    }

    ws.onclose = () => {
        console.warn('WebSocket connection closed')
    }

    ws.onerror = () => {
        storetoast.errorToast(t('certificates.messages.ws_error'))
    }
}

// Token parolini o'rnatish — tokenga yozilgandan keyin avtomatik chaqiriladi
const setSopin = (item) => {
    const ws = new WebSocket('ws://localhost:8181')

    ws.onopen = () => {
        ws.send(JSON.stringify({
            function: 'setSopin',
            token_sn: item.token_sn,
            cert_sn: item.cert_sn,
        }))
    }

    ws.onmessage = async (evt) => {
        const res = JSON.parse(evt.data)
        if (res.status === 'success') {
            try {
                await $api('certificates/set-token-password/', {
                    method: 'POST',
                    body: { cert_sn: item.cert_sn, password: res.password },
                })
            } catch (err) {
                console.error('set-token-password error:', err)
            }
        } else {
            storetoast.errorToast(res.comments)
        }
        // tokenga yozib bo'lingach ro'yxatni yangilaymiz -> status o'zgaradi -> "tokenga yozish" actioni yo'qoladi
        refresh()
        ws.close()
    }

    ws.onerror = () => {
        storetoast.errorToast(t('certificates.messages.ws_error'))
        refresh()
    }
}

// Tokenni tozalash — WebSocket orqali ePass/iKey tokenini clear qilish
const clearToken = () => {
    const ws = new WebSocket('ws://localhost:8181')

    ws.onopen = () => {
        ws.send(JSON.stringify({ function: 'clearToken', token_type: 'ePass/iKey' }))
    }

    ws.onmessage = (evt) => {
        const res = JSON.parse(evt.data)
        if (res.status === 'success') {
            storetoast.successToast('Токен успешно очищен')
        } else {
            storetoast.errorToast(res.comments)
        }
        ws.close()
    }

    ws.onclose = () => {
        console.warn('WebSocket connection closed')
    }

    ws.onerror = () => {
        storetoast.errorToast(t('certificates.messages.ws_error'))
    }
}

// PFX yuklab olish — API dan olib yuklab olish
const downloadPFX = async (item) => {
    try {
        const res = await $api(`certificates/${item.cert_sn}/`)
        let pfxData = res?.data?.pfx ?? res?.pfx ?? res?.result?.pfx

        if (!pfxData) {
            storetoast.errorToast(t('certificates.messages.pfx_not_found'))
            return
        }

        const a = document.createElement('a')
        a.download = `${item.cert_sn}.pfx`

        if (typeof pfxData === 'string' && (pfxData.startsWith('http://') || pfxData.startsWith('https://'))) {
            a.href = pfxData
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
        } else {
            const bytes = Uint8Array.from(atob(String(pfxData)), c => c.charCodeAt(0))
            const blob = new Blob([bytes], { type: 'application/x-pkcs12' })
            const url = URL.createObjectURL(blob)
            a.href = url
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            setTimeout(() => URL.revokeObjectURL(url), 1000)
        }

        await $api(`certificates/imported/${item.cert_sn}/`, { method: 'POST' })
        refresh()
    } catch {
        storetoast.errorToast(t('certificates.messages.ws_error'))
    }
}
</script>

<template>
    <VCard>
        <VRow class="px-4 py-4">
            <VCol class="d-flex align-center gap-3">
                <p class="text-22 font-roboto mb-0">
                    <VIcon size="22" icon="tabler-file-certificate" />
                    {{ $t('certificates.title') }}
                </p>
                <VBtn
                    color="warning"
                    variant="tonal"
                    size="small"
                    prepend-icon="tabler-eraser"
                    @click="clearToken"
                >
                    Tokenni tozalash
                </VBtn>
            </VCol>
            <VCol class="d-flex justify-end">
                <VCol cols="12" sm="6">
                    <AppTextField v-model="searchQuery" :placeholder="$t('search')" density="compact"
                        prepend-inner-icon="tabler-search" />
                </VCol>
                <VCol cols="12" sm="4">
                    <AppSelect
                        :placeholder="$t('select_status')"
                        :items="statuFilterData"
                        v-model="status"
                        clearable
                        clear-icon="tabler-x"
                        item-value="value"
                        item-title="label"
                    />
                </VCol>
                <VCol cols="12" sm="5">
                    <div class="w-100 h-100 border rounded d-flex align-center justify-space-between px-4">
                        <div>
                            {{ $t('clients.all') }}
                            <span class="ms-1">{{ statusReport.total }}</span>
                        </div>
                        <div>
                            <VIcon size="24" icon="tabler-circle-check" color="#28C76F" class="mr-1" />
                            <span>{{ statusReport.active }}</span>
                        </div>
                        <div>
                            <VIcon size="24" icon="tabler-rotate" color="#00BAD1" class="mr-1" />
                            <span>{{ statusReport.updated }}</span>
                        </div>
                        <div>
                            <VIcon size="24" icon="tabler-circle-x" color="#FF4C51" class="mr-1" />
                            <span>{{ statusReport.rejected }}</span>
                        </div>
                    </div>
                </VCol>
                <VCol col="12">
                    <AppSelect
                        :model-value="options.itemsPerPage"
                        :items="itemsPerPageOptions"
                        item-title="title"
                        item-value="value"
                        style="inline-size: 6.25rem;"
                        @update:model-value="onItemsPerPageChange"
                    />
                </VCol>
            </VCol>
        </VRow>

        <VDataTable
            :headers="headers"
            :items="tableData"
            :items-per-page="-1"
            :loading="load"
            :hover="true"
            :loading-text="$t('common.loading')"
            hide-default-footer
        >
            <template #item="{ item, columns, index }">
                <tr :class="getRowProps(item)">
                    <td v-for="column in columns" :key="column.key">

                        <!-- actions -->
                        <template v-if="column.key === 'actions'">
                            <div class="d-flex justify-center">
                                <VBtn icon variant="text" size="small" color="medium-emphasis">
                                    <VIcon size="24" icon="tabler-dots-vertical" />
                                    <VMenu activator="parent">
                                        <VList>
                                            <!-- Tokenga yozish — status=1 (READY_TO_WRITE) -->
                                            <VListItem
                                                v-if="item.status == 1"
                                                @click="writeToToken(item)"
                                            >
                                                <template #prepend>
                                                    <VIcon icon="tabler-usb" color="#7367F0" />
                                                </template>
                                                <VListItemTitle>{{ $t('certificates.actions.write_to_token') }}</VListItemTitle>
                                            </VListItem>

                                            <!-- PFX yuklab olish  status=2 (READY_TO_INSTALL) yoki cng=0 (RSA) -->
                                            <!-- <VListItem
                                                v-if="item.status == 2 || item.cng == 0"
                                                @click="downloadPFX(item)"
                                            >
                                                <template #prepend>
                                                    <VIcon icon="tabler-file-certificate" color="#FF9F43" />
                                                </template>
                                                <VListItemTitle>{{ $t('certificates.actions.download_pfx') }}</VListItemTitle>
                                            </VListItem>
                                                -->
                                            <!-- Bekor qilish -->
                                            <VListItem
                                                v-if="item.status != 0"
                                                @click="openRevokeDialog(item)"
                                            >
                                                <template #prepend>
                                                    <VIcon icon="tabler-circle-x" color="#FF4C51" />
                                                </template>
                                                <VListItemTitle>{{ $t('certificates.actions.revoke') }}</VListItemTitle>
                                            </VListItem>

                                            <!-- Yangilash -->
                                            <VListItem
                                                v-if="item.status != 0 && item.status != 3"
                                                @click="updateItem(item)"
                                            >
                                                <template #prepend>
                                                    <VIcon icon="tabler-refresh" color="#00BAD1" />
                                                </template>
                                                <VListItemTitle>{{ $t('certificates.actions.update') }}</VListItemTitle>
                                            </VListItem>

                                            <!-- PDF yuklab olish -->
                                            <VListItem @click="downloadPDF(item)">
                                                <template #prepend>
                                                    <VIcon icon="tabler-file-download" color="#28C76F" />
                                                </template>
                                                <VListItemTitle>{{ $t('certificates.download') }}</VListItemTitle>
                                            </VListItem>

                                        </VList>
                                    </VMenu>
                                </VBtn>
                            </div>
                        </template>

                        <!-- status -->
                        <template v-else-if="column.key === 'status'">
                          <span v-if="item.status != null" :class="statusText(item.status)?.class">
                            {{ statusText(item.status).text }}
                          </span>
                        </template>

                            <!-- № -->
                            <template v-else-if="column.key === 'id'">
                                {{
                                    options.itemsPerPage > 0
                                        ? (options.page - 1) * options.itemsPerPage + index + 1
                                        : index + 1
                                }}
                            </template>

                            <template v-else>
                                {{ item[column.key] }}
                            </template>

                    </td>
                </tr>
            </template>

            <template #no-data>
                <div class="text-center py-4">{{ $t('no_data') }}</div>
            </template>

            <template #bottom>
                <VCardText class="pt-2">
                    <div class="d-flex justify-end">
                        <VPagination
                            v-if="tableData.length"
                            v-model="options.page"
                            :total-visible="$vuetify.display.smAndDown ? 3 : 5"
                            :length="totalPages"
                        />
                    </div>
                </VCardText>
            </template>
        </VDataTable>
    </VCard>

    <!-- Dialogs -->
    <RevokeDialog
        v-model="revokeDialog"
        :cert-sn="selectedCertSn"
        :is-admin="isAdmin"
        @revoked="onRevoked"
    />

    <ReissueDialog
        v-model="reissueDialog"
        :item="selectedReissueItem"
        @reissued="onReissued"
    />

    <EditClient
        v-model:isDrawerOpen="isAddNewUserDrawerVisible"
        v-model:update_dataId="updateDataId"
        @refresh="refresh"
    />

    <DeleteDialog
        v-model:delete-dialog="deleteDialog"
        @closeDelete="deleteDialog = false"
        @deleteItemConfirm="deleteItemConfirm"
    />
</template>

<style scoped>
.v-data-table thead th {
    background-color: #f3f2f3;
    border-spacing: 0;
}
.green-row { background-color: #ffd0d4 !important; }
.active { color: #28C76F !important; }
.history { color: #00BAD1 !important; }
.error { color: #FF4C51 !important; }
</style>