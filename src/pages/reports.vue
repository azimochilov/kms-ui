<script setup>
import { useReports } from '@/@core/stores/reports'
import { useToast } from '@/@core/stores/toastConfig'
import { useI18n } from 'vue-i18n'
import { VDataTable } from 'vuetify/labs/VDataTable'

const { t } = useI18n()

definePage({
  meta: {
    action: 'read',
    subject: 'AclDemo',
  },
})

const store = useReports()
const storetoast = useToast()

const filters = ref({
  from_date: '',
  to_date: '',
  branch: '',
})
const loading = ref({
  summary: false,
  meta: false,
  exportSummaryPdf: false,
  exportSummaryExcel: false,
  exportCb: false,
  exportUsers: false,
  exportLostTokens: false,
})

const summaryHeaders = computed(() => [
  { title: t('reports.table.branch'), key: 'branch' },
  { title: t('reports.table.total'), key: 'total' },
  { title: t('reports.table.active'), key: 'active_count' },
  { title: t('reports.table.revoked'), key: 'revoked_count' },
  { title: t('reports.table.imported'), key: 'imported_count' },
  { title: t('reports.table.updated'), key: 'updated_count' },
  { title: t('reports.table.clients'), key: 'clients_count' },
])

const summaryRows = computed(() => store.summary?.branches || [])
const options = ref({
  page: 1,
  itemsPerPage: 10,
})
const hasSummaryData = computed(() => summaryRows.value.length > 0)
const selectedBranchLabel = computed(() => filters.value.branch || t('reports.filters.all_branches'))
const summaryContextText = computed(() => {
  if (!filters.value.from_date || !filters.value.to_date)
    return ''

  return t('reports.hints.current_scope', {
    from: filters.value.from_date,
    to: filters.value.to_date,
    branch: selectedBranchLabel.value,
  })
})
const paginationLength = computed(() => {
  const perPage = Number(options.value.itemsPerPage || 10)
  const total = summaryRows.value.length

  return Math.max(1, Math.ceil(total / perPage))
})
const paginatedSummaryRows = computed(() => {
  const page = Math.max(1, Number(options.value.page || 1))
  const perPage = Math.max(1, Number(options.value.itemsPerPage || 10))
  const start = (page - 1) * perPage

  return summaryRows.value.slice(start, start + perPage)
})

const formatDateForInput = dateValue => {
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime()))
    return ''

  return date.toISOString().slice(0, 10)
}

const extractErrorMessage = error => {
  const body = error?.response?._data
  if (typeof body?.detail === 'string' && body.detail)
    return body.detail
  if (typeof body?.error?.detail === 'string' && body.error.detail)
    return body.error.detail
  if (typeof error?.message === 'string' && error.message)
    return error.message

  return t('reports.errors.default')
}

const validateSummaryFilters = () => {
  if (!filters.value.from_date || !filters.value.to_date) {
    storetoast.errorToast(t('reports.errors.select_dates'))

    return false
  }

  if (filters.value.from_date > filters.value.to_date) {
    storetoast.errorToast(t('reports.errors.invalid_range'))

    return false
  }

  return true
}

const refreshSummary = async () => {
  if (!validateSummaryFilters())
    return

  options.value.page = 1
  loading.value.summary = true
  try {
    await store.fetchSummary(filters.value)
  }
  catch (error) {
    storetoast.errorToast(extractErrorMessage(error))
  }
  finally {
    loading.value.summary = false
  }
}

const exportSummary = async format => {
  if (!validateSummaryFilters())
    return

  const loadingKey = format === 'pdf' ? 'exportSummaryPdf' : 'exportSummaryExcel'
  loading.value[loadingKey] = true
  try {
    await store.exportSummary(filters.value, format)
    storetoast.successToast(t('reports.messages.download_started'))
  }
  catch (error) {
    storetoast.errorToast(extractErrorMessage(error))
  }
  finally {
    loading.value[loadingKey] = false
  }
}

const exportCB = async () => {
  loading.value.exportCb = true
  try {
    await store.exportCB()
    storetoast.successToast(t('reports.messages.download_started'))
  }
  catch (error) {
    storetoast.errorToast(extractErrorMessage(error))
  }
  finally {
    loading.value.exportCb = false
  }
}

const exportUsers = async () => {
  loading.value.exportUsers = true
  try {
    await store.exportUsersRegistry()
    storetoast.successToast(t('reports.messages.download_started'))
  }
  catch (error) {
    storetoast.errorToast(extractErrorMessage(error))
  }
  finally {
    loading.value.exportUsers = false
  }
}

const exportLostTokens = async () => {
  loading.value.exportLostTokens = true
  try {
    await store.exportLostTokensRegistry()
    storetoast.successToast(t('reports.messages.download_started'))
  }
  catch (error) {
    storetoast.errorToast(extractErrorMessage(error))
  }
  finally {
    loading.value.exportLostTokens = false
  }
}

const loadMeta = async () => {
  loading.value.meta = true
  try {
    await store.fetchMeta()
  }
  catch (error) {
    storetoast.errorToast(extractErrorMessage(error))
  }
  finally {
    loading.value.meta = false
  }
}

onMounted(async () => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  filters.value.from_date = formatDateForInput(firstDay)
  filters.value.to_date = formatDateForInput(now)

  await loadMeta()
  await refreshSummary()
})

watch(summaryRows, () => {
  if (options.value.page > paginationLength.value)
    options.value.page = paginationLength.value
})

watch(() => options.value.itemsPerPage, () => {
  options.value.page = 1
})
</script>

<template>
  <VRow>
    <VCol cols="12">
      <VCard>
        <VRow class="px-4 pt-4 pb-2">
          <VCol cols="12">
            <p class="text-22 font-roboto">
              <VIcon size="22" icon="tabler-chart-bar" /> {{ $t('reports.title') }}
            </p>
            <p class="text-medium-emphasis mb-0 mt-1">
              {{ $t('reports.hints.summary_intro') }}
            </p>
          </VCol>
        </VRow>

        <VRow class="px-4 pb-4 reports-filters-row">
          <VCol cols="12" sm="6" md="3">
            <AppTextField
              v-model="filters.from_date"
              :label="$t('reports.filters.from')"
              type="date"
              density="compact"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppTextField
              v-model="filters.to_date"
              :label="$t('reports.filters.to')"
              type="date"
              density="compact"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <AppSelect
              v-model="filters.branch"
              :items="[
                { title: $t('reports.filters.all_branches'), value: '' },
                ...store.branches.map(branch => ({ title: branch, value: branch })),
              ]"
              :label="$t('reports.filters.branch')"
              :loading="loading.meta"
              density="compact"
              item-title="title"
              item-value="value"
            />
          </VCol>
          <VCol cols="12" sm="6" md="3" class="d-flex flex-column">
            <div class="reports-field-label-spacer" />
            <VBtn block :loading="loading.summary" @click="refreshSummary">
              {{ $t('reports.actions.generate') }}
            </VBtn>
          </VCol>

          <VCol cols="12" sm="6" md="3">
            <VBtn
              block
              variant="tonal"
              color="secondary"
              :loading="loading.exportSummaryPdf"
              :disabled="!hasSummaryData || loading.summary"
              @click="exportSummary('pdf')"
            >
              <VIcon start icon="tabler-file-type-pdf" />
              {{ $t('reports.actions.export_pdf') }}
            </VBtn>
          </VCol>
          <VCol cols="12" sm="6" md="3">
            <VBtn
              block
              variant="tonal"
              color="success"
              :loading="loading.exportSummaryExcel"
              :disabled="!hasSummaryData || loading.summary"
              @click="exportSummary('excel')"
            >
              <VIcon start icon="tabler-file-spreadsheet" />
              {{ $t('reports.actions.export_excel') }}
            </VBtn>
          </VCol>
          <VCol cols="12" sm="6" md="3" />
          <VCol cols="12" sm="6" md="3" class="d-flex align-end justify-end">
            <AppSelect
              :model-value="options.itemsPerPage"
              :items="[
                { value: 10, title: '10' },
                { value: 25, title: '25' },
                { value: 50, title: '50' },
                { value: 100, title: '100' },
              ]"
              hide-details
              density="compact"
              class="reports-page-size-select"
              style="inline-size: 6.25rem; max-inline-size: 6.25rem; min-inline-size: 6.25rem;"
              @update:model-value="options.itemsPerPage = parseInt($event, 10)"
            />
          </VCol>
          <!-- <VCol cols="12" sm="6" md="3">
            <VBtn
              block
              variant="tonal"
              color="success"
              :loading="loading.exportCb"
              @click="exportCB"
            >
              <VIcon start icon="tabler-download" />
              {{ $t('reports.actions.export_cb') }}
            </VBtn>
          </VCol> -->
          <VCol cols="12" class="pt-0">
            <p class="text-caption text-medium-emphasis mb-0">
              {{ summaryContextText }}
            </p>
          </VCol>
        </VRow>

        <VDivider class="reports-table-divider" />
        <div class="reports-table-section">
          <VDataTable
            :headers="summaryHeaders"
            :items="paginatedSummaryRows"
            :loading="loading.summary"
            hide-default-footer
            class="reports-table"
          >
            <template #no-data>
              <div class="text-center py-8">
                <VIcon icon="tabler-database-off" size="34" class="mb-2 text-medium-emphasis" />
                <div class="text-body-1 mb-1">{{ $t('no_data') }}</div>
                <div class="text-caption text-medium-emphasis">
                  {{ $t('reports.hints.empty_summary') }}
                </div>
              </div>
            </template>

            <template #bottom>
              <div class="reports-pagination-divider" />
              <VCardText class="pt-2">
                <div class="d-flex justify-end">
                  <VPagination
                    v-if="summaryRows.length > 0"
                    v-model="options.page"
                    :total-visible="$vuetify.display.smAndDown ? 3 : 5"
                    :length="paginationLength"
                  />
                </div>
              </VCardText>
            </template>
          </VDataTable>
        </div>

      </VCard>
    </VCol>

    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>{{ $t('reports.registry.title') }}</VCardTitle>
          <VCardSubtitle>{{ $t('reports.hints.registry_intro') }}</VCardSubtitle>
        </VCardItem>
        <VCardText>
          <VRow>
            <VCol cols="12" md="6">
              <VBtn
                block
                variant="tonal"
                color="primary"
                :loading="loading.exportUsers"
                @click="exportUsers"
              >
                <VIcon start icon="tabler-users" />
                {{ $t('reports.actions.export_users') }}
              </VBtn>
            </VCol>
            <VCol cols="12" md="6">
              <VBtn
                block
                variant="tonal"
                color="error"
                :loading="loading.exportLostTokens"
                @click="exportLostTokens"
              >
                <VIcon start icon="tabler-alert-triangle" />
                {{ $t('reports.actions.export_lost_tokens') }}
              </VBtn>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style scoped>
.reports-filters-row {
  row-gap: 6px;
}

.reports-table :deep(thead th) {
  white-space: nowrap;
}

.reports-table-divider {
  margin-block-start: 2px;
}

.reports-table-section {
  margin-block-start: 10px;
}

.reports-pagination-divider {
  display: block;
  block-size: 0;
  inline-size: 100%;
  margin-block: 48px 6px;
  border-top: 1px solid #d9d9e3;
}

.reports-page-size-select {
  inline-size: 6.25rem !important;
  max-inline-size: 6.25rem !important;
  min-inline-size: 6.25rem !important;
  flex: 0 0 6.25rem;
}

.reports-page-size-select :deep(.v-field) {
  min-block-size: 40px;
}

.reports-field-label-spacer {
  block-size: 24px;
}
</style>
