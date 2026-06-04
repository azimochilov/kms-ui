<script setup>
import { useToast } from '@/@core/stores/toastConfig'
import { useTokens } from '@/@core/stores/tokens'
import DeleteDialog from "@/components/DeleteDialog.vue"
import AllocateTokenDialog from '@/components/token/allocateTokenDialog.vue'
import UploadTokenDialog from '@/components/token/uploadTokenDialog.vue'
import AssignTokenDialog from '@/components/token/assignTokenDialog.vue'
import { useI18n } from 'vue-i18n'
import { VDataTable } from 'vuetify/labs/VDataTable'

const { t } = useI18n()

definePage({
    meta: {
        action: 'read',
        subject: 'member',
    }
})

const storeToast = useToast()
const store = useTokens()

// Dialog states
const deleteDialog = ref(false)
const isUploadDialogOpen = ref(false)
const isAllocateDialogOpen = ref(false)
const isAssignDialogOpen = ref(false)

const itemId = ref(null)
const load = ref(true)
const isClearingToken = ref(false)

const options = ref({ page: 1, itemsPerPage: 12 })

const filterUsed = ref(null) // null = hammasi, 0 = ishlatilmagan, 1 = ishlatilgan

const headers = computed(() => [
  { title: '№', key: 'index', sortable: false },
  { title: t('tokenModule.seria_number'), key: 'seria_number' },
  { title: t('tokenModule.is_used'), key: 'is_used' },
  { title: t('tokenModule.branch_user'), key: 'branch' },
  { title: t('tokenModule.actions'), key: 'actions', sortable: false, align: 'center' },
])

const refresh = () => {
  load.value = true
  const filters = {}
  if (filterUsed.value !== null && filterUsed.value !== '') {
    filters.is_used = filterUsed.value
  }
  store.fetchTokens(options.value.itemsPerPage, options.value.page, filters)
    .then(() => { load.value = false })
    .catch(() => { load.value = false })
}

const deleteToken = (id) => {
  itemId.value = id
  deleteDialog.value = true
}

const deleteTokenConfirm = () => {
  store.deleteToken(itemId.value)
    .then(() => {
      storeToast.successToast(t('tokenModule.token_deleted'))
      deleteDialog.value = false
      itemId.value = null
      refresh()
    })
    .catch(error => {
      storeToast.errorsNotfications(error.response?._data?.errors)
    })
}

const clearToken = () => {
  if (isClearingToken.value)
    return

  isClearingToken.value = true
  let gotResponse = false

  const ws = new WebSocket('ws://localhost:8181')

  ws.onopen = () => {
    const payload = {
      function: 'clearToken',
      token_type: 'ePass/iKey',
    }
    ws.send(JSON.stringify(payload))
  }

  ws.onmessage = evt => {
    gotResponse = true

    try {
      const obj = JSON.parse(evt.data)

      if (obj?.status === 'success')
        storeToast.successToast(t('tokenModule.clear_success'))
      else
        storeToast.errorToast(obj?.comments || t('error'))
    } catch {
      storeToast.errorToast(t('error'))
    } finally {
      isClearingToken.value = false
      ws.close()
    }
  }

  ws.onerror = () => {
    isClearingToken.value = false
    storeToast.errorToast(t('tokenModule.ws_connection_error'))
    ws.close()
  }

  ws.onclose = () => {
    if (!gotResponse)
      storeToast.errorToast(t('tokenModule.ws_closed'))

    isClearingToken.value = false
  }
}

watch(filterUsed, () => {
  options.value.page = 1
  refresh()
})

onMounted(() => {
  refresh()
})
</script>

<template>
  <VCard>
    <!-- Header -->
    <VRow class="px-4 py-4" align="center">
      <VCol>
        <p class="text-h6 font-weight-medium mb-0">
          <VIcon size="22" icon="tabler-key" class="me-1" />
          {{ $t('tokenModule.title') }}
        </p>
      </VCol>

      <VCol class="d-flex justify-end gap-2 flex-wrap">
        <!-- Filter -->
        <VSelect
          v-model="filterUsed"
          :items="[
            { title: $t('tokenModule.all'), value: null },
            { title: $t('tokenModule.not_used'), value: 0 },
            { title: $t('tokenModule.used'), value: 1 },
          ]"
          item-title="title"
          item-value="value"
          density="compact"
          hide-details
          style="max-width: 160px"
          :placeholder="$t('tokenModule.filter')"
        />

        <!-- Assign (branch user uchun) -->
        <VBtn
          color="error"
          variant="tonal"
          :loading="isClearingToken"
          :disabled="isClearingToken"
          @click="clearToken"
        >
          <VIcon size="18" icon="tabler-eraser" class="me-1" />
          {{ $t('tokenModule.clear_token') }}
        </VBtn>

        <VBtn
          color="warning"
          variant="tonal"
          @click="isAssignDialogOpen = true"
        >
          <VIcon size="18" icon="tabler-link" class="me-1" />
          {{ $t('tokenModule.assign') }}
        </VBtn>

        <!-- Allocate (admin uchun) -->
        <VBtn
          color="secondary"
          variant="tonal"
          @click="isAllocateDialogOpen = true"
        >
          <VIcon size="18" icon="tabler-transfer" class="me-1" />
          {{ $t('tokenModule.allocate') }}
        </VBtn>

        <!-- Upload CSV (admin uchun) -->
        <VBtn
          color="success"
          variant="tonal"
          @click="isUploadDialogOpen = true"
        >
          <VIcon size="18" icon="tabler-upload" class="me-1" />
          {{ $t('tokenModule.upload_csv') }}
        </VBtn>

      </VCol>
    </VRow>

    <!-- Table -->
    <VDataTable
      :headers="headers"
      :items="store.tokens?.data || []"
      :loading="load"
      hide-default-footer
    >
      <template #no-data>
        <div class="text-center py-6 text-medium-emphasis">
          <VIcon size="40" icon="tabler-database-off" class="mb-2" />
          <p>{{ $t('no_data') }}</p>
        </div>
      </template>

      <!-- Row number -->
      <template #item.index="{ index }">
        {{ (options.page - 1) * options.itemsPerPage + index + 1 }}
      </template>

      <!-- Status chip -->
      <template #item.is_used="{ item }">
        <VChip
          :color="item.is_used === 1 ? 'error' : 'success'"
          size="small"
          label
        >
          {{ item.is_used === 1 ? $t('tokenModule.used') : $t('tokenModule.not_used') }}
        </VChip>
      </template>

      <!-- Filial nomi -->
      <template #item.branch="{ item }">
        <span v-if="item.branch">{{ item.branch }}</span>
        <span v-else class="text-medium-emphasis">—</span>
      </template>

      <!-- Actions -->
      <template #item.actions="{ item }">
        <div class="d-flex justify-center">
          <VBtn
            icon
            variant="text"
            size="small"
            color="error"
            @click="deleteToken(item.id)"
          >
            <VIcon icon="tabler-trash" size="20" />
            <VTooltip activator="parent" location="top">
              {{ $t('tokenModule.delete') }}
            </VTooltip>
          </VBtn>
        </div>
      </template>

      <!-- Pagination -->
      <template #bottom>
        <VCardText class="pt-2">
          <div class="d-flex justify-end">
            <VPagination
              v-if="store.tokens?.data"
              v-model="options.page"
              :total-visible="$vuetify.display.smAndDown ? 3 : 5"
              :length="Math.ceil((store.tokens?.pagination?.total || 0) / options.itemsPerPage)"
              @update:model-value="refresh"
            />
          </div>
        </VCardText>
      </template>
    </VDataTable>
  </VCard>

  <!-- Upload CSV Dialog -->
  <UploadTokenDialog
    v-model:is-dialog-open="isUploadDialogOpen"
    @refresh="refresh"
  />

  <!-- Allocate Dialog -->
  <AllocateTokenDialog
    v-model:is-dialog-open="isAllocateDialogOpen"
    @refresh="refresh"
  />

  <!-- Assign Dialog -->
  <AssignTokenDialog
    v-model:is-dialog-open="isAssignDialogOpen"
    @refresh="refresh"
  />

  <!-- Delete Dialog -->
  <DeleteDialog
    v-model:delete-dialog="deleteDialog"
    @closeDelete="deleteDialog = false"
    @deleteItemConfirm="deleteTokenConfirm"
  />
</template>

<style scoped>
.v-data-table thead th {
  background-color: rgb(var(--v-theme-surface));
  font-weight: 600;
}
.v-data-table tbody tr:hover {
  background-color: rgba(var(--v-theme-primary), 0.04);
}
.gap-2 {
  gap: 8px;
}
</style>