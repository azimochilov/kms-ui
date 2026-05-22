<script setup>

import { useClient } from '@/@core/stores/client'
import { useToast } from '@/@core/stores/toastConfig'
import AddDevices from '@/components/clients/AddDevices.vue'
import DeleteDialog from "@/components/DeleteDialog.vue"
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { VDataTable } from 'vuetify/labs/VDataTable'


const { t } = useI18n()
definePage({
    meta: {
        action: 'read',
        subject: 'AclDemo',
    }
})
const route = useRoute()

const deleteDialog = ref(false)
const itemId = ref(null)
const storetoast = useToast()
const isDialogVisible = ref(false)




const deleteItemConfirm = () => {
    store.deleteDevice(itemId.value)
        .then(() => {
            storetoast.successToast(t('settingsModule.device_deleted'))
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


const options = ref({ page: 1, itemsPerPage: 12, sortBy: [''], sortDesc: [false] })
const isAddNewUserDrawerVisible = ref(false)
const load = ref(true)
const store = useClient()
const updateDataId = ref(null)
const clientData = ref(null)
// headers
const headers = computed(() => [
    { title: '№', key: 'id' },
    { title: t('clients.device_id_type'), key: 'type' },
    { title: t('clients.device_id_number'), key: 'device_id' },
    { title: t('settingsModule.status'), key: 'status' },
    { title: t('settingsModule.action'), key: 'actions' },
])

// headers
const headersCertificate = computed(() => [
    { title: '№', key: 'id' },
    { title: t('certificates.owner_name'), key: 'cname' },
    { title: t('certificates.token_serial_number'), key: 'token_sn' },
    { title: t('certificates.certificate_serial_number'), key: 'cert_sn' },
    { title: t('certificates.from_date'), key: 'cert_from' },
    { title: t('certificates.to_date'), key: 'cert_to' },
    // { title: 'дата', key: 'test2' },
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
    store.fetOneClient(route.params.id)
        .then(res => {
            clientData.value = res.result
            load.value = false
        }).catch(error => {
            console.log(error.response.status);
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
</script>

<template>
    <VCard>
        <VRow class="px-4 py-4">
            <VCol>
                <p class="text-22 font-roboto">
                    <VIcon size="22" icon="tabler-devices" />
                    <!-- {{ $t('settingsModule.control') }} -->
                    {{ $t('clients.client_devices') }}
                </p>
            </VCol>
            <VCol class="d-flex justify-end">

                <!-- Orqaga button -->
                <VBtn variant="outlined" class="mr-3" @click="$router.back()">
                    <VIcon size="18" icon="tabler-arrow-left" class="mr-1" />
                    {{ $t('back') }}
                </VBtn>


                <!-- <AddNewUserDrawer v-model:isDrawerOpen="isAddNewUserDrawerVisible" v-model:update_dataId="updateDataId"
        @refresh="refresh" /> -->
                <VBtn color="primary" @click="isAddNewUserDrawerVisible = true">
                    <VIcon size="22" icon="tabler-plus" />{{ $t('settingsModule.add') }}
                </VBtn>
            </VCol>

        </VRow>

        <VDataTable :headers="headers" :items="clientData?.devices || []" :loading="load">
            <template #no-data>
                <div class="text-center py-4">
                    {{ $t('no_data') }}

                </div>
            </template>

            <!-- Actions -->
            <template #item.actions="{ item }">
                <div>
                    <VListItem @click="deleteUser(item.id)">
                        <template #prepend>
                            <VIcon icon="tabler-trash" />
                        </template>
                    </VListItem>
                </div>
            </template>

            <template #item.id="{ index }">
                <span>{{ index + 1 }}</span>
            </template>

            <!-- bottom pagination  -->
            <template #bottom>
            </template>

        </VDataTable>
    </VCard>






    <!-- -----------------------------------tabel certificate ----------------------------------- -->

    <VCard class="mt-16">
        <VRow class="px-4 py-4">
            <VCol>
                <p class="text-22 font-roboto">
                    <VIcon size="22" icon="tabler-file-certificate" />
                    <!-- {{ $t('settingsModule.control') }} -->
                    {{ $t('clients.client_certificates') }}
                </p>
            </VCol>
        </VRow>
        <VDataTable :headers="headersCertificate" :items="clientData?.certificates || []" :loading="load">
            <template #no-data>
                <div class="text-center py-4">
                    {{ $t('no_data') }}
                </div>
            </template>

            <!-- Actions -->
            <template #item.actions="{ item }">
                <div>
                    {{ $t('certificates.actions.revoked') }}
                </div>
            </template>
            <template #item.id="{ index }">
                <span>{{ index + 1 }}</span>
            </template>

            <!-- bottom pagination  -->
            <template #bottom>
            </template>
        </VDataTable>
    </VCard>


    <AddDevices v-model:isDrawerOpen="isAddNewUserDrawerVisible" @refresh="refresh" />


    <DeleteDialog v-model:delete-dialog="deleteDialog" @closeDelete="deleteDialog = false"
        @deleteItemConfirm="deleteItemConfirm" />





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
