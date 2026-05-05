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
        subject: 'AclDemo',
    }
})

const deleteDialog = ref(false)
const itemId = ref(null)
const storetoast = useToast()
const isDialogVisible = ref(false)
const passwordId = ref(null)




const deleteItemConfirm = () => {
    store.deleteUsers(itemId.value)
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
const store = useUsers()
const updateDataId = ref(null)
// headers
const headers = [
    { title: '№', key: 'id' },
    { title: t('settingsModule.username'), key: 'username' },
    { title: t('settingsModule.full_name'), key: 'full_name' },
    { title: t('settingsModule.branch'), key: 'branch' },

    { title: t('settingsModule.type'), key: 'type' },
    { title: t('settingsModule.mfo'), key: 'mfo' },
    { title: t('settingsModule.action'), key: 'actions' },
]



const deleteUser = (id) => {
    itemId.value = id
    deleteDialog.value = true
}

const editUser = (id) => {
    updateDataId.value = id
    isAddNewUserDrawerVisible.value = true
}

const refresh = () => {
    store.fetchUsers(options.value.itemsPerPage, options.value.page)
        .then(() => {
            load.value = false
        }).catch(error => {
            load.value = false
        })
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
</script>

<template>
    <VCard>
        <VRow class="px-4 py-4">
            <VCol>
                <p class="text-22 font-roboto">
                    <VIcon size="22" icon="tabler-user" /> {{ $t('settingsModule.control') }}
                </p>
            </VCol>
            <VCol class="d-flex justify-end">
                <VBtn color="primary" @click="isAddNewUserDrawerVisible = true">
                    <VIcon size="22" icon="tabler-plus" />{{ $t('settingsModule.add') }}
                </VBtn>
            </VCol>

        </VRow>

        <VDataTable :headers="headers" :items="store.users?.data || []" :loading="load">


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

                                <VListItem @click="isDialogVisible = true, passwordId = item.id">
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



            <template #item.id="{ index }">
                <span>{{ index + 1 }}</span>
            </template>




            <!-- bottom pagination  -->
            <template #bottom>

                <VCardText class="pt-2">
                    <div class="d-flex justify-end">
                        <VPagination v-if="store.users?.data" v-model="options.page"
                            :total-visible="$vuetify.display.smAndDown ? 3 : 5"
                            :length="Math.ceil(store.users?.pagination?.total / options.itemsPerPage)"
                            @click="refresh" />
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


<style scom>
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
