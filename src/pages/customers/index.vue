    <script setup>

    import { useClient } from '@/@core/stores/client'
    import { useToast } from '@/@core/stores/toastConfig'
    import EditClient from '@/components/clients/EditClient.vue'
    import DeleteDialog from "@/components/DeleteDialog.vue"
    import { computed } from 'vue'
    import { useI18n } from 'vue-i18n'
    import { VDataTable } from 'vuetify/labs/VDataTable'



    const { t } = useI18n()
    definePage({
        meta: {
            action: 'read',
            subject: 'AclDemo',
        }
    })

    const deleteDialog = ref(false)
    const itemId = ref(null)
    const storetoast = useToast()
    const isDialogVisible = ref(false)




    const deleteItemConfirm = () => {
        store.deleteClient(itemId.value)
            .then(() => {
                storetoast.successToast(t('settingsModule.user_deleted'))
                deleteDialog.value = false
                itemId.value = null
                refresh()
            }).catch(error => {
                storetoast.errorsNotfications(error.response._data.errors)


            })
    }


    const options = ref({ page: 1, itemsPerPage: 12, sortBy: [''], sortDesc: [false] })
    const isAddNewUserDrawerVisible = ref(false)
    const load = ref(true)
    const store = useClient()
    const updateDataId = ref(null)



    const headers = computed(() => [
        { title: '№', key: 'id' },
        { title: t('clients.owner'), key: 'cname' },
        { title: t('clients.city'), key: 'location' },
        { title: t('clients.address'), key: 'state' },
        { title: t('clients.mail'), key: 'email' },
        { title: t('clients.subdivision'), key: 'org_unit' },
        { title: t('clients.inn'), key: 'inn' },
        { title: t('settingsModule.branch'), key: 'branch' },
        { title: t('settingsModule.action'), key: 'actions' },
    ])



    const deleteUser = (id) => {
        itemId.value = id
        deleteDialog.value = true
    }

    const editUser = (id) => {
        updateDataId.value = id
        isAddNewUserDrawerVisible.value = true
    }

    const refresh = () => {
        load.value = true
        store.fetchClient(options.value.itemsPerPage, options.value.page)
            .then(() => {
                useClient
                useClient

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






    onMounted(() => {
        refresh()

    })
    const getRowProps = (item) => {

        if (!item) return {}

        if (item.status === 0) return 'green-row'
        return {}
    }

    watch(() => options.value.itemsPerPage, (newValue) => {
        if (newValue) {
            refresh()
        }
    }, { deep: true })


</script>

    <template>
        <VCard>
            <button @click="$router.push('/customers/addClient')" class="border">add Client</button>




            <VRow class="px-4 py-4">
                <VCol>
                    <p class="text-22 font-roboto">
                        <VIcon size="22" icon="tabler-users" /> {{ $t('clients.title') }}
                    </p>
                </VCol>
                <VCol class="d-flex justify-end">


                    <VCol cols="12" sm="6">
                        <AppTextField :placeholder="$t('search')" density="compact"
                            prepend-inner-icon="tabler-search" />
                    </VCol>
                    <!-- 👉 Select Status -->
                    <VCol cols="12" sm="4">
                        <AppSelect :placeholder="$t('select_status')" :items="[1, 2, 3, 4]" clearable
                            clear-icon="tabler-x" />
                    </VCol>

                    <VCol cols="12" sm="5">
                        <div class="w-100 h-100 border rounded d-flex align-center justify-space-between px-4">
                            <div>
                                {{ $t('clients.all') }}
                            </div>
                            <div>
                                <VIcon size="24" icon="tabler-circle-check" color="#28C76F" class="mr-1" />
                                <span>3</span>
                            </div>
                            <div>
                                <VIcon size="24" icon="tabler-circle-x" color="#FF4C51" class="mr-1" />
                                <span>5</span>
                            </div>
                            <div>
                                <VIcon size="24" icon="tabler-history" color="#00BAD1" class="mr-1" />
                                <span>3</span>
                            </div>





                        </div>

                    </VCol>

                    <VCol col="12">

                        <AppSelect :model-value="options.itemsPerPage" :items="[
                            { value: 10, title: '10' },
                            { value: 25, title: '25' },
                            { value: 50, title: '50' },
                            { value: 100, title: '100' },
                            { value: -1, title: 'All' },
                        ]" style="inline-size: 6.25rem;"
                            @update:model-value="options.itemsPerPage = parseInt($event, 10)" />
                    </VCol>

                </VCol>

            </VRow>
            <VDataTable :headers="headers" :items="store.clients.data || []" :loading="load" :hover="true"
                loading-text="yuklanmoqda">
                <template #item="{ item, columns }">
                    <tr :class="getRowProps(item)">
                        <td v-for="column in columns" :key="column.key">

                            <slot :name="`item.${column.key}`" :item="item" :index="item.index">


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
                                                        <VListItemTitle>Edit</VListItemTitle>
                                                    </VListItem>

                                                    <VListItem @click="deleteUser(item.id)">
                                                        <template #prepend>
                                                            <VIcon icon="tabler-trash" />
                                                        </template>
                                                        <VListItemTitle>Delete</VListItemTitle>
                                                    </VListItem>

                                                    <VListItem @click="$router.push(`customers/client/${item.id}`)">
                                                        <template #prepend>
                                                            <VIcon icon="tabler-eye" />
                                                        </template>
                                                        <VListItemTitle>Show</VListItemTitle>
                                                    </VListItem>
                                                </VList>
                                            </VMenu>
                                        </VBtn>
                                    </div>
                                </template>

                                <!-- boshqa ustunlar uchun oddiy value -->
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
                            <VPagination v-if="store.clients?.pagination" v-model="options.page"
                                :total-visible="$vuetify.display.smAndDown ? 3 : 5"
                                :length="Math.ceil(store.clients?.pagination?.total / options.itemsPerPage)"
                                @click="refresh" />
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
