    <script setup>

    import { useClient } from '@/@core/stores/client'
    import { useToast } from '@/@core/stores/toastConfig'
    import EditClient from '@/components/clients/EditClient.vue'
    import DeleteDialog from "@/components/DeleteDialog.vue"
    import { computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { VDataTable } from 'vuetify/labs/VDataTable'
    import { $api } from '@/utils/api'



    const { t } = useI18n()
    definePage({
        meta: {
            action: 'read',
            subject: 'member',
        }
    })

    const deleteDialog = ref(false)
    const itemId = ref(null)
    const storetoast = useToast()
    const isDialogVisible = ref(false)

    // --- rejected comment dialog ---
    const commentDialog = ref(false)
    const selectedRejectedItem = ref(null)

    const openCommentDialog = (item) => {
        selectedRejectedItem.value = item
        commentDialog.value = true
    }

    const openEditFromComment = () => {
        commentDialog.value = false
        updateDataId.value = selectedRejectedItem.value?.id
        isAddNewUserDrawerVisible.value = true
    }




    const deleteItemConfirm = () => {
        store.deleteClient(itemId.value)
            .then(() => {
                storetoast.successToast(t('settingsModule.client_deleted'))
                deleteDialog.value = false
                itemId.value = null
                refresh()
            }).catch(error => {
                const message = error?.response?._data?.message
                    ?? error?.response?._data?.detail
                    ?? error?.response?._data?.errors
                    ?? error?.message
                    ?? t('error')
                storetoast.errorToast(String(message))
                deleteDialog.value = false


            })
    }


    const options = ref({ page: 1, itemsPerPage: 10, sortBy: [''], sortDesc: [false] })
    const searchQuery = ref('')
    const statusFilter = ref(null)
    const deviceTypeFilter = ref(null)
    let searchDebounceTimer = null
    const isAddNewUserDrawerVisible = ref(false)
    const load = ref(true)
    const store = useClient()
    const updateDataId = ref(null)



    const headers = computed(() => [
        { title: '№', key: 'id' },
        { title: t('clients.owner'), key: 'cname' },
        { title: t('clients.city'), key: 'location' },
        { title: t('clients.subdivision'), key: 'org_unit' },
        { title: t('clients.inn'), key: 'inn' },
        { title: t('clients.phone'), key: 'phone' },
        { title: t('settingsModule.branch'), key: 'branch' },
        { title: t('clients.primary_device_type'), key: 'primary_device_type' },
        { title: t('settingsModule.status'), key: 'status' },
        { title: t('settingsModule.action'), key: 'actions' },
    ])

    const deviceTypeOptions = computed(() => [
        { title: t('clients.device_type_epass'), value: 'epass/ikey' },
        { title: t('clients.device_type_virtual'), value: 'virtual' },
        { title: t('clients.device_type_mobile'), value: 'mobile' },
    ])

    const deviceTypeChip = (type) => {
        const map = {
            'epass/ikey': { color: 'warning', label: 'ePass/iKey' },
            'virtual':    { color: 'info',    label: 'Virtual' },
            'mobile':     { color: 'success', label: 'Mobile' },
            'smartcard':  { color: 'secondary', label: 'Smartcard' },
        }
        return map[type] ?? { color: 'default', label: type ?? '—' }
    }



    const deleteUser = (id) => {
        itemId.value = id
        deleteDialog.value = true
    }

    const editUser = (id) => {
        updateDataId.value = id
        isAddNewUserDrawerVisible.value = true
    }

    const refreshingPhoneId = ref(null)

    const refreshPhone = async (item) => {
        refreshingPhoneId.value = item.id
        try {
            const res = await $api(`clients/${item.id}/refresh-phone/`, { method: 'POST' })
            item.phone = res.phone
            storetoast.successToast('Telefon raqam yangilandi')
        } catch (err) {
            const msg = err?.data?.error ?? err?.message ?? t('error')
            storetoast.errorToast(String(msg))
        } finally {
            refreshingPhoneId.value = null
        }
    }

    const totalPages = computed(() => {
        const total = Number(store.clients?.pagination?.total ?? 0)
        const perPage = Number(options.value.itemsPerPage ?? 0)

        if (perPage <= 0)
            return 1

        return Math.max(1, Math.ceil(total / perPage))
    })

    const tableItemsPerPage = computed(() => {
        if (Number(options.value.itemsPerPage) === -1)
            return -1

        return Number(options.value.itemsPerPage) || 10
    })

    const statusOptions = computed(() => [
        { title: t('settingsModule.active'), value: 1 },
        { title: t('settingsModule.inactive'), value: 0 },
    ])

    const refresh = () => {
        load.value = true
        store.fetchClient(options.value.itemsPerPage, options.value.page, {
            search: searchQuery.value,
            status: statusFilter.value,
            primary_device_type: deviceTypeFilter.value,
        })
            .then(() => {
                load.value = false
            }).catch(error => {

                if (error.response.status >= 500) {
                    storetoast.errorToast('server xatoligi')

                }
                else {
                    storetoast.errorsNotfications(error.response._data.errors)

                }

                load.value = false
            })
    }

    const onItemsPerPageChange = value => {
        const normalizedValue = typeof value === 'object' && value !== null
            ? (value.value ?? value.id ?? value.title ?? value)
            : value

        const parsed = Number(normalizedValue)
        if (Number.isFinite(parsed)) {
            options.value.itemsPerPage = parsed
            return
        }

        if (String(normalizedValue).toLowerCase() === 'all') {
            options.value.itemsPerPage = -1
        }
    }






    onMounted(() => {
        refresh()

    })

    onBeforeUnmount(() => {
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer)
            searchDebounceTimer = null
        }
    })
    const getRowProps = (item) => {

        if (!item) return {}

        if (item.status === 0) return 'green-row'
        return {}
    }

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

    watch(statusFilter, () => {
        if (options.value.page !== 1) {
            options.value.page = 1
            return
        }
        refresh()
    })

    watch(deviceTypeFilter, () => {
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


</script>

    <template>
        <VCard>
            <VRow class="px-4 py-4">
                <VCol>
                    <p class="text-22 font-roboto">
                        <VIcon size="22" icon="tabler-users" /> {{ $t('clients.title') }}
                    </p>
                </VCol>
                <VCol class="d-flex justify-end">

                    <VCol cols="12" sm="6">
                        <AppTextField v-model="searchQuery" :placeholder="$t('search')" density="compact"
                            prepend-inner-icon="tabler-search" />
                    </VCol>
                    <!-- 👉 Select Status -->
                    <VCol cols="12" sm="4">
                        <AppSelect v-model="statusFilter" :placeholder="$t('select_status')" :items="statusOptions"
                            item-title="title" item-value="value" clearable
                            clear-icon="tabler-x" />
                    </VCol>

                    <!-- 👉 Select Device Type -->
                    <VCol cols="12" sm="4">
                        <AppSelect v-model="deviceTypeFilter" :placeholder="$t('clients.primary_device_type')"
                            :items="deviceTypeOptions" item-title="title" item-value="value" clearable
                            clear-icon="tabler-x" />
                    </VCol>

                    <VCol col="12">

                        <AppSelect :model-value="options.itemsPerPage" :items="[
                            { value: 10, title: '10' },
                            { value: 25, title: '25' },
                            { value: 50, title: '50' },
                            { value: 100, title: '100' },
                            { value: -1, title: 'All' },
                        ]" item-title="title" item-value="value" style="inline-size: 6.25rem;"
                            @update:model-value="onItemsPerPageChange" />
                    </VCol>

                </VCol>

            </VRow>
            <VDataTable :headers="headers" :items="store.clients.data || []" :items-per-page="tableItemsPerPage"
                :loading="load" :hover="true"
                :loading-text="$t('common.loading')">
                <template #item="{ item, index }">
                    <tr :class="getRowProps(item)">
                        <td v-for="column in headers" :key="column.key">

                            <slot :name="`item.${column.key}`" :item="item" :index="index">


                                <!-- actions ustunini alohida chiqarish -->
                                <template v-if="column.key === 'actions'">
                                    <div class=" d-flex justify-center">
                                        <VBtn icon variant="text" size="small" color="medium-emphasis">
                                            <VIcon size="24" icon="tabler-dots-vertical" />
                                            <VMenu activator="parent">
                                                <VList>
                                                    <VListItem link @click="editUser(item.id)">
                                                        <template #prepend>
                                                            <VIcon icon="tabler-pencil" />
                                                        </template>
                                                        <VListItemTitle>{{ $t('settingsModule.edit') }}</VListItemTitle>
                                                    </VListItem>

                                                    <VListItem @click="deleteUser(item.id)">
                                                        <template #prepend>
                                                            <VIcon icon="tabler-trash" />
                                                        </template>
                                                        <VListItemTitle>{{ $t('common.delete') }}</VListItemTitle>
                                                    </VListItem>

                                                    <VListItem @click="refreshPhone(item)" :disabled="refreshingPhoneId === item.id">
                                                        <template #prepend>
                                                            <VIcon :icon="refreshingPhoneId === item.id ? 'tabler-loader' : 'tabler-phone-plus'" />
                                                        </template>
                                                        <VListItemTitle>Telefon yangilash</VListItemTitle>
                                                    </VListItem>

                                                    <VListItem @click="$router.push(`customers/client/${item.id}`)">
                                                        <template #prepend>
                                                            <VIcon icon="tabler-eye" />
                                                        </template>
                                                        <VListItemTitle>{{ $t('common.show') }}</VListItemTitle>
                                                    </VListItem>
                                                </VList>
                                            </VMenu>
                                        </VBtn>
                                    </div>
                                </template>

                                <!-- boshqa ustunlar uchun oddiy value -->
                                <template v-else-if="column.key === 'id'">
                                    {{
                                        tableItemsPerPage > 0
                                            ? (options.page - 1) * tableItemsPerPage + index + 1
                                            : index + 1
                                    }}
                                </template>

                                <template v-else-if="column.key === 'primary_device_type'">
                                    <VChip
                                        :color="deviceTypeChip(item.primary_device_type).color"
                                        size="small"
                                        label
                                    >
                                        {{ deviceTypeChip(item.primary_device_type).label }}
                                    </VChip>
                                </template>

                                <template v-else-if="column.key === 'status'">
                                    <template v-if="item.fix && item.comment">
                                        <div class="d-flex align-center gap-1">
                                            <VChip
                                                color="warning"
                                                size="small"
                                                label
                                                class="cursor-pointer"
                                                @click="openCommentDialog(item)"
                                            >
                                                Rad etilgan
                                            </VChip>
                                            <VIcon
                                                size="18"
                                                icon="tabler-message-exclamation"
                                                color="warning"
                                                class="cursor-pointer"
                                                @click="openCommentDialog(item)"
                                            />
                                        </div>
                                    </template>
                                    <VChip
                                        v-else
                                        :color="item.status === 1 ? 'success' : 'error'"
                                        size="small"
                                        label
                                    >
                                        {{ item.status === 1 ? $t('settingsModule.active') : $t('settingsModule.inactive') }}
                                    </VChip>
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
                        <div class="d-flex align-center justify-space-between">
                            <VBtn color="primary" @click="$router.push('/customers/addClient')">
                                <VIcon size="22" icon="tabler-plus" class="me-1" />{{ $t('settingsModule.add') }}
                            </VBtn>
                            <VPagination v-if="store.clients?.pagination" v-model="options.page"
                                :total-visible="$vuetify.display.smAndDown ? 3 : 5"
                                :length="totalPages" />
                        </div>
                    </VCardText>

                </template>
            </VDataTable>
        </VCard>


        <!-- <AddNewUserDrawer v-model:isDrawerOpen="isAddNewUserDrawerVisible" v-model:update_dataId="updateDataId"
            @refresh="refresh" /> -->
        <EditClient v-model:isDrawerOpen="isAddNewUserDrawerVisible" v-model:update_dataId="updateDataId"
            @refresh="refresh" />

        <DeleteDialog v-model:delete-dialog="deleteDialog" @closeDelete="deleteDialog = false"
            @deleteItemConfirm="deleteItemConfirm" />

        <!-- Rad etilgan client izohi -->
        <VDialog v-model="commentDialog" max-width="480">
            <VCard>
                <VCardTitle class="d-flex align-center gap-2 pa-4">
                    <VIcon icon="tabler-message-exclamation" color="warning" size="22" />
                    Rad etilish sababi
                </VCardTitle>
                <VDivider />
                <VCardText class="pa-4">
                    <p class="text-body-1">{{ selectedRejectedItem?.comment }}</p>
                </VCardText>
                <VDivider />
                <VCardActions class="pa-4 gap-2">
                    <VBtn variant="tonal" color="secondary" @click="commentDialog = false">
                        Yopish
                    </VBtn>
                    <VBtn color="primary" prepend-icon="tabler-pencil" @click="openEditFromComment">
                        Tahrirlash
                    </VBtn>
                </VCardActions>
            </VCard>
        </VDialog>





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
