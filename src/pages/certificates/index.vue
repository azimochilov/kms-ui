<script setup>
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
        subject: 'AclDemo',
    }
})

const reissueDialog = ref(false)
const selectedReissueItem = ref(null)
const storetoast = useToast()
const store = useCertificate()
const userData = useCookie('userData')
// console.log(userData.value?.role)
const isAdmin = computed(() => userData.value?.role === 'admin')

// --- table options ---
const options = ref({ page: 1, itemsPerPage: 12, sortBy: [''], sortDesc: [false] })
const load = ref(true)
const status = ref(null)
const isAddNewUserDrawerVisible = ref(false)
const updateDataId = ref(null)

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
    // { title: 'pdf', key: 'pdf' },
    { title: t('settingsModule.action'), key: 'actions' },
])

// --- status filter ---
const statuFilterData = ref([
    { value: 4, label: t('certificates.statuses.installed') },
    { value: 3, label: t('certificates.statuses.updated') },
    { value: 0, label: t('certificates.statuses.revoked') },
])

// --- refresh ---
const refresh = () => {
    load.value = true
    store.fetchCertificate(options.value.itemsPerPage, options.value.page)
        .then(() => {
            load.value = false
        })
        .catch(error => {
            if (error.response?.status >= 500) {
                storetoast.errorToast('server xatoligi')
            }
            load.value = false
        })
}

onMounted(() => refresh())

watch(status, (newValue) => {
    if (newValue !== null && newValue !== undefined) {
        store.filterCertificate(newValue)
    } else {
        refresh()
    }
})

watch(() => options.value.itemsPerPage, () => refresh(), { deep: true })

// --- helpers ---
const getRowProps = (item) => {
    if (!item) return {}
    if (item.id === 1) return 'green-row'
    return {}
}

const statusText = (status) => {
    const map = {
        4: { class: 'active',  key: 'certificates.statuses.installed'  },
        3: { class: 'history', key: 'certificates.statuses.updated'    },
        2: { class: 'active',  key: 'certificates.statuses.pfx_ready'  },
        1: { class: 'active',  key: 'certificates.statuses.token_ready'},
        0: { class: 'error',   key: 'certificates.statuses.revoked'    },
    }

    const found = map[status]
    if (found) return { class: found.class, text: t(found.key) }

    return { class: '', text: String(status ?? '-') }
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

// const updateItem = async (item) => {
//     // file input ochish
//     const input = document.createElement('input')
//     input.type = 'file'
//     input.accept = '.pdf'
//     // console.log(item)
//     input.onchange = async (e) => {
//         const file = e.target.files[0]
//         if (!file) return
//
//         const formData = new FormData()
//         formData.append('cert_id', item.id)
//         formData.append('file', file)
//
//         try {
//             await $api('certificates/reissue/', {
//                 method: 'POST',
//                 body: formData,
//             })
//             storetoast.successToast(t('certificate.updating'))
//             refresh()
//         } catch (err) {
//             storetoast.errorToast(err?.data?.error || 'Xatolik yuz berdi')
//         }
//     }
//
//     input.click()
// }
</script>

<template>
    <VCard>
        <VRow class="px-4 py-4">
            <VCol>
                <p class="text-22 font-roboto">
                    <VIcon size="22" icon="tabler-file-certificate" />
                    {{ $t('certificates.title') }}
                </p>
            </VCol>
            <VCol class="d-flex justify-end">
                <VCol cols="12" sm="6">
                    <AppTextField :placeholder="$t('search')" density="compact" prepend-inner-icon="tabler-search" />
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
                    <div class="w-100 h-100 border rounded d-flex align-center gap-2 px-4">
                        <div>{{ $t('clients.all') }}</div>
                        <div>
                            <VIcon size="24" icon="tabler-circle-check" color="#28C76F" class="mr-1" />
                            <span>{{ store.certificates?.status_report?.active || 0 }}</span>
                        </div>
                        <div>
                            <VIcon size="24" icon="tabler-rotate" color="#00BAD1" class="mr-1" />
                            <span>{{ store.certificates?.status_report?.updated || 0 }}</span>
                        </div>
                    </div>
                </VCol>
                <VCol col="12">
                    <AppSelect
                        :model-value="options.itemsPerPage"
                        :items="[
                          { value: 12, title: '12' },
                          { value: 25, title: '25' },
                          { value: 50, title: '50' },
                          { value: 100, title: '100' },
                          { value: -1, title: 'All' },
                        ]"
                        style="inline-size: 6.25rem;"
                        @update:model-value="options.itemsPerPage = parseInt($event, 10)"
                    />
                </VCol>
            </VCol>
        </VRow>

        <VDataTable
            :headers="headers"
            :items="store.certificates?.data || []"
            :loading="load"
            :hover="true"
            loading-text="Yuklanmoqda"
            :items-per-page="options.itemsPerPage"
        >
            <template #item="{ item, columns }">
                <tr :class="getRowProps(item)">
                    <td v-for="column in columns" :key="column.key">

                        <!-- actions -->
                        <template v-if="column.key === 'actions'">
                            <div class="d-flex justify-center">
                                <VBtn icon variant="text" size="small" color="medium-emphasis">
                                    <VIcon size="24" icon="tabler-dots-vertical" />
                                    <VMenu activator="parent">
                                        <VList>

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

                        <!-- pdf column endi kerak emas, headers dan olib tashlang -->

                        <!-- status -->
                        <template v-else-if="column.key === 'status'">
                          <span v-if="item.status != null" :class="statusText(item.status)?.class">
                            {{ statusText(item.status).text }}
                          </span>
                        </template>

<!--                        &lt;!&ndash; pdf &ndash;&gt;-->
<!--                        <template v-else-if="column.key === 'pdf'">-->
<!--                            <VListItemTitle class="cursor-pointer text-cancel" @click="downloadPDF(item)">-->
<!--                                {{ $t('certificates.download') }}-->
<!--                            </VListItemTitle>-->
<!--                        </template>-->

                        <!-- default -->
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
                            v-if="store.certificates?.pagination"
                            v-model="options.page"
                            :total-visible="$vuetify.display.smAndDown ? 3 : 5"
                            :length="Math.ceil(store.certificates?.pagination?.total / options.itemsPerPage)"
                            @click="refresh"
                        />
                    </div>
                </VCardText>
            </template>
        </VDataTable>
    </VCard>

    <!-- Dialogs — template tashqarisida, VCard dan keyin -->
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
