<script setup>
import { useLogs } from '@/@core/stores/logs'
import { useToast } from '@/@core/stores/toastConfig'
import { useI18n } from 'vue-i18n'
import { VDataTable } from 'vuetify/labs/VDataTable'

const { t } = useI18n()

definePage({
  meta: {
    action: 'read',
    subject: 'admin-only',
  },
})

const store = useLogs()
const storetoast = useToast()
const load = ref(false)
const options = ref({ page: 1, itemsPerPage: 12 })
const filters = ref({
  search: '',
  username: '',
  action: '',
  date_from: '',
  date_to: '',
})
const dateFromInputType = ref('text')
const dateToInputType = ref('text')

const usernameFilterItems = computed(() => [
  { title: t('logs.all_users'), value: '' },
  ...store.filterOptions.usernames.map(username => ({
    title: username,
    value: username,
  })),
])

const actionFilterItems = computed(() => [
  { title: t('logs.all_actions'), value: '' },
  ...store.filterOptions.actions.map(action => ({
    title: action,
    value: action,
  })),
])

const headers = computed(() => [
  { title: '№', key: 'id' },
  { title: t('logs.username'), key: 'username' },
  { title: t('logs.action'), key: 'action' },
  { title: t('logs.comment'), key: 'comment' },
  { title: t('logs.ip_address'), key: 'ip_address' },
  { title: t('logs.created_at'), key: 'created_at' },
])

const paginationLength = computed(() => {
  const perPage = Number(options.value.itemsPerPage)
  const total = Number(store.logs?.pagination?.total || 0)

  if (!perPage || perPage < 0)
    return 1

  return Math.max(1, Math.ceil(total / perPage))
})

const formatDateTime = value => {
  if (!value)
    return '-'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime()))
    return String(value)

  return parsed.toLocaleString()
}

const formatContext = value => {
  if (!value || (typeof value === 'object' && Object.keys(value).length === 0))
    return '-'

  if (typeof value === 'string')
    return value

  try {
    return JSON.stringify(value)
  }
  catch {
    return String(value)
  }
}

const refresh = () => {
  load.value = true

  store.fetchLogs(options.value.itemsPerPage, options.value.page, filters.value)
    .catch(error => {
      const statusCode = error?.response?.status ?? 500
      if (statusCode >= 500)
        storetoast.errorToast('server xatoligi')
      else if (statusCode === 403)
        storetoast.errorToast(t('logs.admin_only'))
      else
        storetoast.errorsNotfications(error?.response?._data?.errors || error?.response?._data?.detail || 'Error')
    })
    .finally(() => {
      load.value = false
    })
}

const goFirstPageAndRefresh = () => {
  if (options.value.page !== 1)
    options.value.page = 1
  else
    refresh()
}

const clearFilters = () => {
  filters.value = {
    search: '',
    username: '',
    action: '',
    date_from: '',
    date_to: '',
  }
  dateFromInputType.value = 'text'
  dateToInputType.value = 'text'
  goFirstPageAndRefresh()
}

const handleDateFromBlur = () => {
  if (!filters.value.date_from)
    dateFromInputType.value = 'text'
}

const handleDateToBlur = () => {
  if (!filters.value.date_to)
    dateToInputType.value = 'text'
}

let searchDebounceTimer = null
watch(() => filters.value.search, () => {
  if (searchDebounceTimer)
    clearTimeout(searchDebounceTimer)

  searchDebounceTimer = setTimeout(() => {
    goFirstPageAndRefresh()
  }, 350)
})

watch(() => [filters.value.username, filters.value.action, filters.value.date_from, filters.value.date_to], () => {
  goFirstPageAndRefresh()
})

watch(() => options.value.page, () => {
  refresh()
})

watch(() => options.value.itemsPerPage, () => {
  goFirstPageAndRefresh()
})

onMounted(async () => {
  await store.fetchFilterOptions()
  refresh()
})
</script>

<template>
  <VCard>
    <VRow class="px-4 pt-4 pb-2">
      <VCol cols="12">
        <p class="text-22 font-roboto">
          <VIcon size="22" icon="tabler-file-text" /> {{ $t('logs.title') }}
        </p>
      </VCol>
    </VRow>

    <div class="px-4 pb-4 logs-filters">
      <VRow class="logs-filters__row" align="end">
        <VCol cols="12" md="4">
          <AppTextField
            v-model="filters.search"
            class="w-100"
            :placeholder="$t('search')"
            density="compact"
            prepend-inner-icon="tabler-search"
            hide-details
          />
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <AppSelect
            v-model="filters.username"
            class="w-100"
            :items="usernameFilterItems"
            item-title="title"
            item-value="value"
            :label="$t('logs.username')"
            density="compact"
            clearable
            hide-details
          />
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <AppSelect
            v-model="filters.action"
            class="w-100"
            :items="actionFilterItems"
            item-title="title"
            item-value="value"
            :label="$t('logs.action')"
            density="compact"
            clearable
            hide-details
          />
        </VCol>

        <VCol cols="12" sm="6" md="2">
          <AppSelect
            :model-value="options.itemsPerPage"
            class="w-100"
            :items="[
              { value: 10, title: '10' },
              { value: 25, title: '25' },
              { value: 50, title: '50' },
              { value: 100, title: '100' },
            ]"
            :label="$t('logs.per_page')"
            density="compact"
            hide-details
            @update:model-value="options.itemsPerPage = parseInt($event, 10)"
          />
        </VCol>
      </VRow>

      <VRow class="logs-filters__row logs-filters__row--secondary" align="end">
        <VCol cols="12" sm="6" md="3">
          <AppTextField
            v-model="filters.date_from"
            class="w-100"
            :label="$t('logs.date_from')"
            :type="dateFromInputType"
            density="compact"
            prepend-inner-icon="tabler-calendar"
            hide-details
            @focus="dateFromInputType = 'date'"
            @blur="handleDateFromBlur"
          />
        </VCol>

        <VCol cols="12" sm="6" md="3">
          <AppTextField
            v-model="filters.date_to"
            class="w-100"
            :label="$t('logs.date_to')"
            :type="dateToInputType"
            density="compact"
            prepend-inner-icon="tabler-calendar"
            hide-details
            @focus="dateToInputType = 'date'"
            @blur="handleDateToBlur"
          />
        </VCol>

        <VCol cols="12" md="6" class="logs-filters__actions">
          <VBtn class="logs-clear-btn" @click="clearFilters">
            {{ $t('logs.clear') }}
          </VBtn>
        </VCol>
      </VRow>
    </div>

    <VDataTable
      :headers="headers"
      :items="store.logs?.data || []"
      :loading="load"
      :items-per-page="options.itemsPerPage"
      loading-text="yuklanmoqda"
    >
      <template #item="{ item, columns }">
        <tr>
          <td v-for="column in columns" :key="column.key">
            <template v-if="column.key === 'created_at'">
              {{ formatDateTime(item.created_at) }}
            </template>
            <template v-else>
              {{ item[column.key] }}
            </template>
          </td>
        </tr>
      </template>

      <template #no-data>
        <div class="text-center py-4">
          {{ $t('no_data') }}
        </div>
      </template>

      <template #bottom>
        <VCardText class="pt-2">
          <div class="d-flex justify-end">
            <VPagination
              v-if="store.logs?.pagination"
              v-model="options.page"
              :total-visible="$vuetify.display.smAndDown ? 3 : 5"
              :length="paginationLength"
            />
          </div>
        </VCardText>
      </template>
    </VDataTable>
  </VCard>
</template>

<style scoped>
.v-data-table :deep(thead th) {
  background-color: #f3f2f3;
}

.logs-filters__row {
  margin: 0;
}

.logs-filters__row--secondary {
  margin-top: 12px;
}

.logs-filters__actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.logs-clear-btn {
  min-inline-size: 140px;
  min-block-size: 40px;
  border: 1px solid rgba(124, 107, 255, 0.32);
  background: linear-gradient(135deg, #7c6bff 0%, #9c8ff9 100%);
  box-shadow: 0 8px 16px rgba(124, 107, 255, 0.28);
  color: #fff !important;
}

.logs-clear-btn:hover {
  background: linear-gradient(135deg, #705dff 0%, #9183f7 100%);
}

@media (max-width: 959px) {
  .logs-filters__actions {
    justify-content: stretch;
  }

  .logs-clear-btn {
    inline-size: 100%;
  }
}
</style>
