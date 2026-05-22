<script setup>

import { useToast } from '@/@core/stores/toastConfig'
import { useUsers } from '@/@core/stores/users'
import DeleteDialog from "@/components/DeleteDialog.vue"
import { useI18n } from 'vue-i18n'
import { VDataTable } from 'vuetify/labs/VDataTable'
import EdintPassword from './editPassword.vue'


const { t } = useI18n()
definePage({
    meta: {
        action: 'read',
        subject: 'admin',
    }
})

const deleteDialog = ref(false)
const itemId = ref(null)
const storetoast = useToast()
const isDialogVisible = ref(false)
const passwordId = ref(null)




const deleteItemConfirm = () => {
    store.deleteUserByRowId(itemId.value)
        .then(() => {
            storetoast.successToast(t('settingsModule.user_deleted'))
            deleteDialog.value = false
            itemId.value = null
            refresh()
        }).catch(error => {
            const errors = error?.response?._data?.errors
            const detail = error?.response?._data?.detail
            const message = error?.response?._data?.message || error?.message
            if (errors)
                storetoast.errorsNotfications(errors)
            else if (detail)
                storetoast.errorToast(String(detail))
            else
                storetoast.errorToast(message || t('error'))
            deleteDialog.value = false
            itemId.value = null

        })
}


const options = ref({ page: 1, itemsPerPage: 10, sortBy: [''], sortDesc: [false] })
const isAddNewUserDrawerVisible = ref(false)
const load = ref(true)
const store = useUsers()
const updateDataId = ref(null)
const filters = ref({
    search: '',
    status: null,
})
const normalizeStatusFilter = value => {
    const normalizedValue = typeof value === 'object' && value !== null
        ? (value.value ?? value.id ?? value.title ?? value)
        : value

    if (normalizedValue === null || normalizedValue === undefined || normalizedValue === '')
        return null

    const parsed = Number(normalizedValue)

    return Number.isFinite(parsed) ? parsed : null
}
const statusOptions = computed(() => [
    { value: 1, title: t('settingsModule.active') },
    { value: 0, title: t('settingsModule.inactive') },
])
// headers
const headers = [
    { title: '№', key: 'id' },
    { title: t('settingsModule.username'), key: 'username' },
    { title: t('settingsModule.full_name'), key: 'full_name' },
    { title: t('settingsModule.branch'), key: 'branch' },

    { title: t('settingsModule.type'), key: 'type' },
    { title: t('settingsModule.status'), key: 'status' },
    { title: t('settingsModule.mfo'), key: 'mfo' },
    { title: t('settingsModule.action'), key: 'actions' },
]



const deleteUser = (id) => {
    if (!id) {
        storetoast.errorToast(t('error'))
        return
    }

    itemId.value = id
    deleteDialog.value = true
}

const editUser = async (id) => {
    if (!id) {
        storetoast.errorToast(t('error'))
        return
    }

    const resolvedId = await store.resolveUserIdFromRow(id)
    if (!resolvedId) {
        storetoast.errorToast(t('error'))
        return
    }

    updateDataId.value = resolvedId
    isAddNewUserDrawerVisible.value = true
}

const getUserId = (tableItem) => {
    const rawItem = tableItem?.raw || tableItem

    return rawItem?.id ?? rawItem?.user_id ?? rawItem?.pk ?? rawItem?.uid ?? null
}

const tableItems = computed(() => {
    const rawItems = Array.isArray(store.users?.data) ? store.users.data : []
    const statusFilter = normalizeStatusFilter(filters.value.status)
    const search = String(filters.value.search ?? '').trim().toLowerCase()

    return rawItems.filter(item => {
        if (statusFilter !== null && Number(item?.status) !== statusFilter)
            return false

        if (!search)
            return true

        const haystack = [
            item?.username,
            item?.full_name,
            item?.branch,
            item?.type,
            item?.mfo,
        ]
            .filter(Boolean)
            .map(value => String(value).toLowerCase())
            .join(' ')

        return haystack.includes(search)
    })
})

const refresh = () => {
    load.value = true
    store.fetchUsers(options.value.itemsPerPage, options.value.page, {
        ...filters.value,
        status: normalizeStatusFilter(filters.value.status),
    })
        .then(() => {
            load.value = false
        }).catch(error => {
            load.value = false
        })
}

const onItemsPerPageChange = value => {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isNaN(parsed) && parsed > 0)
        options.value.itemsPerPage = parsed
}





const resolveStatusVariant = (status) => {
    if (status === 1)
        return { color: 'primary', text: 'Current' }
    else if (status === 2)
        return { color: 'success', text: 'Professional' }
    else if (status === 3)
        return { color: 'error', text: 'Rejected' }
    else if (status === 4)
        return { color: 'warning', text: 'Resigned' }
    else
        return { color: 'info', text: 'Applied' }
}

onMounted(() => {
    refresh()

})

let searchDebounceTimer = null
watch(() => filters.value.search, () => {
    if (searchDebounceTimer)
        clearTimeout(searchDebounceTimer)

    searchDebounceTimer = setTimeout(() => {
        options.value.page = 1
        refresh()
    }, 350)
})

watch(() => filters.value.status, () => {
    const normalizedStatus = normalizeStatusFilter(filters.value.status)
    if (filters.value.status !== normalizedStatus) {
        filters.value.status = normalizedStatus
        return
    }

    options.value.page = 1
    refresh()
})

watch(() => options.value.itemsPerPage, () => {
    options.value.page = 1
    refresh()
})
</script>

<template>
    <VCard>
        <VRow class="px-4 py-4">
            <VCol>
                <p class="text-22 font-roboto">
                    <VIcon size="22" icon="tabler-users" /> {{ $t('settings') }}
                </p>
            </VCol>
            <VCol class="d-flex justify-end">
                <VCol cols="12" sm="6">
                    <AppTextField v-model="filters.search" :placeholder="$t('search')" density="compact"
                        prepend-inner-icon="tabler-search" />
                </VCol>
                <VCol cols="12" sm="4">
                    <AppSelect v-model="filters.status" :placeholder="$t('select_status')" :items="statusOptions"
                        item-title="title" item-value="value" clearable clear-icon="tabler-x" />
                </VCol>
                <VCol col="12">
                    <AppSelect :model-value="options.itemsPerPage" :items="[
                        { value: 10, title: '10' },
                        { value: 25, title: '25' },
                        { value: 50, title: '50' },
                        { value: 100, title: '100' },
                    ]" item-title="title" item-value="value" style="inline-size: 6.25rem;"
                        @update:model-value="onItemsPerPageChange" />
                </VCol>
            </VCol>
        </VRow>

        <VDataTable :headers="headers" :items="tableItems" :loading="load">


            <template #no-data>
                <div class="text-center py-4">
                    {{ $t('no_data') }}

                </div>
            </template>




            <!-- Actions -->
            <template #item.actions="{ item }">
                <div class=" d-flex justify-center">
                    <VBtn icon variant="text" size="small" color="medium-emphasis">
                        <VIcon size="24" icon="tabler-dots-vertical" />
                        <VMenu activator="parent">
                            <VList>
                                <!-- <VListItem>
                                    <template #prepend>
                                        <VIcon icon="tabler-eye" />
                                    </template>

<VListItemTitle>View</VListItemTitle>
</VListItem> -->

                                <VListItem link @click="editUser(getUserId(item))">
                                    <template #prepend>
                                        <VIcon icon="tabler-pencil" />
                                    </template>
                                    <VListItemTitle>{{ $t('settingsModule.edit') }}</VListItemTitle>
                                </VListItem>

                                <VListItem @click="deleteUser(getUserId(item))">
                                    <template #prepend>
                                        <VIcon icon="tabler-trash" />
                                    </template>
                                    <VListItemTitle>{{ $t('common.delete') }}</VListItemTitle>
                                </VListItem>

                                <VListItem @click="isDialogVisible = true, passwordId = getUserId(item)">
                                    <template #prepend>
                                        <VIcon icon="tabler-lock-cog" />
                                    </template>
                                    <VListItemTitle>{{ $t('settingsModule.change') }}</VListItemTitle>
                                </VListItem>
                            </VList>
                        </VMenu>
                    </VBtn>
                </div>




            </template>



            <template #item.id="{ item, index }">
                <span>{{ item?.row_index ?? (index + 1) }}</span>
            </template>

            <template #item.status="{ item }">
                <VChip :color="item?.status === 1 ? 'success' : 'secondary'" size="small">
                    {{ item?.status === 1 ? t('settingsModule.active') : t('settingsModule.inactive') }}
                </VChip>
            </template>




            <!-- bottom pagination  -->
            <template #bottom>

                <VCardText class="pt-3">
                    <div class="d-flex align-center justify-space-between">
                        <VBtn color="primary" @click="isAddNewUserDrawerVisible = true">
                            <VIcon size="22" icon="tabler-plus" class="me-1" />{{ $t('settingsModule.add') }}
                        </VBtn>
                        <VPagination v-if="store.users?.data" v-model="options.page"
                            :total-visible="$vuetify.display.smAndDown ? 3 : 5"
                            :length="Math.ceil(store.users?.pagination?.total / options.itemsPerPage)"
                            @update:model-value="refresh" />
                    </div>
                </VCardText>

            </template>
        </VDataTable>
    </VCard>


    <AddNewUserDrawer v-model:isDrawerOpen="isAddNewUserDrawerVisible" v-model:update_dataId="updateDataId"
        @refresh="refresh" />
    <DeleteDialog v-model:delete-dialog="deleteDialog" @closeDelete="deleteDialog = false"
        @deleteItemConfirm="deleteItemConfirm" />

    <EdintPassword v-model:isDialogVisible="isDialogVisible" v-model:passwordId="passwordId" />




</template>


<style scoped>
.v-data-table thead th {
    background-color: #f3f2f3;
    border-spacing: 0;

}

/* .v-data-table thead th:nth-child(1) {
    border-spacing: 0;
} */
.v-data-table tbody tr:hover {
    background-color: #f5f5f5;
    /* Hover holatidagi fon rangi */
}
</style>
