<script setup>
import { useRequests } from '@/@core/stores/request'
import { useToast } from '@/@core/stores/toastConfig'
import DeleteDialog from "@/components/DeleteDialog.vue"
import StatusDescription from '@/components/request/StatusDescription.vue'
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { VDataTable } from 'vuetify/labs/VDataTable'



const { t } = useI18n()
definePage({
    meta: {
        action: 'read',
        subject: 'staff',
    }
})

const deleteDialog = ref(false)
const itemId = ref(null)
const storetoast = useToast()
const isDialogVisible = ref(false)




const deleteItemConfirm = () => {
    store.deleteRequest(itemId.value)
        .then(() => {
            storetoast.successToast(t('settingsModule.user_deleted'))
            deleteDialog.value = false
            itemId.value = null
            refresh()
        }).catch(error => {
            storetoast.errorsNotfications(error.response._data.errors)


        })
}


const options = ref({ page: 1, itemsPerPage: 10, sortBy: [''], sortDesc: [false] })
const isAddNewUserDrawerVisible = ref(false)
const load = ref(true)
const store = useRequests()
const statusData = ref(null)
const request_id = ref(null)
const request_item = ref(null)
const status = ref(null)
const searchQuery = ref('')

const normalizeStatusFilter = value => {
    const normalizedValue = typeof value === 'object' && value !== null
        ? (value.value ?? value.id ?? value.title ?? value)
        : value

    if (normalizedValue === null || normalizedValue === undefined || normalizedValue === '')
        return null

    const parsed = Number(normalizedValue)

    return Number.isFinite(parsed) ? parsed : null
}

const headers = computed(() => [
    { title: '№', key: 'id' },
    { title: t('requests.token'), key: 'token_sn' },
    { title: t('requests.issued'), key: 'cname' },
    { title: t('requests.organization'), key: 'organization' },
    { title: t('requests.orgUnit'), key: 'org_unit' },
    { title: t('requests.branch'), key: 'branch' },
    { title: t('requests.type'), key: 'type' },
    { title: t('settingsModule.action'), key: 'actions' },
])



const typeDevice = (data) => {
    if (data == 1) {
        return t('clients.internet_banking')
    }

    else if (data == 2) {
        return t('clients.mobile_banking')
    }

    else if (data == 3) {
        return t('clients.iabs_user')
    }
    else {
        return ''
    }



}

const statusReport = computed(() => {
    const report = store.requests?.status_report ?? {}

    return {
        new: Number(report.new ?? 0),
        approved: Number(report.approved ?? 0),
        rejected: Number(report.rejected ?? 0),
        total: Number(report.total ?? 0)
            || Number(report.new ?? 0) + Number(report.approved ?? 0) + Number(report.rejected ?? 0),
    }
})

const tableItems = computed(() => {
    const rawItems = store.requests?.all_data?.length
        ? store.requests.all_data
        : (store.requests?.data ?? [])
    const statusFilter = normalizeStatusFilter(status.value)
    const search = String(searchQuery.value ?? '').trim().toLowerCase()

    return rawItems.filter(item => {
        if (statusFilter !== null && Number(item?.status) !== statusFilter)
            return false

        if (!search)
            return true

        const haystack = [
            item?.token_sn,
            item?.cname,
            item?.organization,
            item?.org_unit,
            item?.branch,
            typeDevice(item?.type),
            item?.type,
        ]
            .filter(Boolean)
            .map(value => String(value).toLowerCase())
            .join(' ')

        return haystack.includes(search)
    })
})

const totalPages = computed(() => {
    const perPage = Number(options.value.itemsPerPage)
    if (perPage <= 0)
        return 1

    return Math.max(1, Math.ceil(tableItems.value.length / perPage))
})

const paginatedItems = computed(() => {
    const perPage = Number(options.value.itemsPerPage)
    if (perPage <= 0)
        return tableItems.value

    const start = (options.value.page - 1) * perPage

    return tableItems.value.slice(start, start + perPage)
})






const deleteUser = (id) => {
    itemId.value = id
    deleteDialog.value = true
}

const statusCreate = (value, id) => {
    request_id.value = id
    statusData.value = value
    request_item.value = tableItems.value.find(item => item.id === id)
        || store.requests?.all_data?.find(item => item.id === id)
        || null
    isAddNewUserDrawerVisible.value = true
}

const refresh = () => {
    load.value = true
    store.fetchStatusReport()
        .then(() => {
            load.value = false
        }).catch(error => {
            if (error.response?.status >= 500) {
                storetoast.errorToast('server xatoligi')

            }
            else if (error.response?._data?.errors) {
                storetoast.errorsNotfications(error.response._data.errors)

            }

            load.value = false
        })
}


watch(status, newValue => {
    const normalizedStatus = normalizeStatusFilter(newValue)
    if (newValue !== normalizedStatus) {
        status.value = normalizedStatus
        return
    }

    options.value.page = 1
})

watch(searchQuery, () => {
    options.value.page = 1
})

watch(() => options.value.itemsPerPage, () => {
    options.value.page = 1
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


onMounted(() => {
    refresh()

})
const getRowProps = (item) => {

    if (!item) return {}

    if (item.status === 2) return 'green-row'
    return {}
}

const statuFilterData = computed(() => [
    { value: 0, label: t('requests.new') },
    { value: 1, label: t('requests.approved') },
    { value: 2, label: t('requests.rejected') },
])


</script>

<template>
    <VCard style="overflow-x: auto;">

        <VRow class="px-4 py-4">
            <VCol>
                <p class="text-22 font-roboto">
                    <VIcon size="22" icon="tabler-sort-descending" /> {{ $t('requests.title') }}
                </p>
            </VCol>
            <VCol class="d-flex justify-end">


                <VCol cols="12" sm="6">
                    <AppTextField v-model="searchQuery" :placeholder="$t('search')" density="compact"
                        prepend-inner-icon="tabler-search" />
                </VCol>
                <!-- 👉 Select Status -->
                <VCol cols="12" sm="4">
                    <AppSelect :placeholder="$t('select_status')" :items="statuFilterData" v-model="status" clearable
                        clear-icon="tabler-x" item-value="value" item-title="label" />
                </VCol>


                <VCol cols="12" sm="5">
                    <div class="w-100 h-100 border rounded d-flex align-center justify-space-between px-4">
                        <div>
                            {{ $t('clients.all') }}
                            <span class="ms-1">{{ statusReport.total }}</span>
                        </div>

                        <div>
                            <VIcon size="24" icon="tabler-history" color="#00BAD1" class="mr-1" />
                            <span>{{ statusReport.new }}</span>
                        </div>


                        <div>
                            <VIcon size="24" icon="tabler-circle-check" color="#28C76F" class="mr-1" />
                            <span>{{ statusReport.approved }}</span>
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
            :items="paginatedItems"
            :items-per-page="-1"
            :loading="load"
            :hover="true"
            :loading-text="$t('common.loading')"
            hide-default-footer
        >
            <template #item="{ item, columns, index }">
                <tr :class="getRowProps(item)">
                    <td v-for="column in columns" :key="column.key">

                        <slot :name="`item.${column.key}`" :item="item" :index="item.index">


                            <!-- actions ustunini alohida chiqarish -->
                          <!-- actions template ni shu ko'rinishga o'zgartiring -->
                          <template v-if="column.key === 'actions'">
                              <div class="d-flex justify-center">
                                <VBtn icon variant="text" size="small" color="medium-emphasis"
                                      :disabled="item.status !== 0">
                                  <VIcon size="24" icon="tabler-dots-vertical" />
                                  <VMenu activator="parent" v-if="item.status === 0">
                                    <VList>
                                      <VListItem link @click="statusCreate('confirmation', item.id)">
                                        <template #prepend>
                                          <VIcon icon="tabler-circle-check" color="#28C76F" />
                                        </template>
                                        <VListItemTitle>Tasdiqlash</VListItemTitle>
                                      </VListItem>

                                      <VListItem @click="statusCreate('rejection', item.id)">
                                        <template #prepend>
                                          <VIcon icon="tabler-circle-x" color="#FF4C51" />
                                        </template>
                                        <VListItemTitle>Rad etish</VListItemTitle>
                                      </VListItem>

                                      <VListItem @click="deleteUser(item.id)">
                                        <template #prepend>
                                          <VIcon icon="tabler-trash" color="#FF4C51" />
                                        </template>
                                        <VListItemTitle>Delete</VListItemTitle>
                                      </VListItem>
                                    </VList>
                                  </VMenu>
                                </VBtn>
                              </div>
                          </template>
                            <template v-else-if="column.key == 'type'">
                                {{ typeDevice(item.type) }}

                            </template>


                            <!-- boshqa ustunlar uchun oddiy value -->
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
                        </slot>
                    </td>
                </tr>
            </template>



            <template #no-data>
                <div class="text-center py-4">
                    {{ $t('no_data') }}

                </div>
            </template>










            <!-- bottom pagination  -->
            <template #bottom>
                <VCardText class="pt-2">
                    <div class="d-flex justify-end">
                        <VPagination
                            v-if="tableItems.length"
                            v-model="options.page"
                            :total-visible="$vuetify.display.smAndDown ? 3 : 5"
                            :length="totalPages"
                        />
                    </div>
                </VCardText>

            </template>
        </VDataTable>
    </VCard>


    <!-- <AddNewUserDrawer v-model:isDrawerOpen="isAddNewUserDrawerVisible" v-model:update_dataId="updateDataId"
        @refresh="refresh" /> -->
    <StatusDescription v-model:isDrawerOpen="isAddNewUserDrawerVisible" v-model:status_type="statusData"
        @refresh="refresh" :request_id="request_id" :request_item="request_item" />


    <DeleteDialog v-model:delete-dialog="deleteDialog" @closeDelete="deleteDialog = false"
        @deleteItemConfirm="deleteItemConfirm" />





</template>


<style scom>
.v-data-table thead th {
    background-color: #f3f2f3;
    border-spacing: 0;

}

.green-row {
    background-color: #ffd0d4 !important;
}
</style>
