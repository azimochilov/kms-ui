<script setup>
import VueApexCharts from 'vue3-apexcharts'

import { $api } from '@/utils/api'

const { t } = useI18n()

definePage({
  meta: {
    action: 'read',
    subject: 'all',
  },
})

const chartLoading = ref(false)
const chartError = ref('')
const dashboardLoading = ref(false)
const certificatesByType = ref({
  internet_bank: 0,
  mobile_bank: 0,
  iABS: 0,
  other: 0,
})
const certificateOverview = ref({
  total: 0,
  active: 0,
  revoked: 0,
  updated: 0,
  imported: 0,
})
const expiringStats = ref({
  expiring_in_7_days: 0,
  expiring_in_30_days: 0,
  expiring_in_60_days: 0,
  urgent_count: 0,
  urgent_list: [],
})
const tokenOverview = ref({
  total: 0,
  assigned: 0,
  unassigned: 0,
  active: 0,
  inactive: 0,
})
const sectionErrors = ref({
  certificates_overview: '',
  certificates_expiring: '',
  tokens_overview: '',
})

const chartLabels = computed(() => [
  t('dashboard.chart.internet_bank'),
  t('dashboard.chart.mobile_bank'),
  t('dashboard.chart.iabs'),
  t('dashboard.chart.other'),
])

const chartSeries = computed(() => [
  {
    name: t('dashboard.chart.series_name'),
    data: [
      certificatesByType.value.internet_bank || 0,
      certificatesByType.value.mobile_bank || 0,
      certificatesByType.value.iABS || 0,
      certificatesByType.value.other || 0,
    ],
  },
])

const totalCertificates = computed(() => chartSeries.value[0].data.reduce((sum, value) => sum + Number(value || 0), 0))
const expiringCategories = computed(() => [
  t('dashboard.expiring.in_7_days'),
  t('dashboard.expiring.in_30_days'),
  t('dashboard.expiring.in_60_days'),
])
const statusMixSeries = computed(() => [
  Number(certificateOverview.value.active || 0),
  Number(certificateOverview.value.revoked || 0),
  Number(certificateOverview.value.updated || 0),
  Number(certificateOverview.value.imported || 0),
])
const statusMixLabels = computed(() => [
  t('dashboard.kpi.active'),
  t('dashboard.kpi.revoked'),
  t('dashboard.kpi.updated'),
  t('dashboard.kpi.imported'),
])
const expiringSeries = computed(() => [
  {
    name: t('dashboard.expiring.series_name'),
    data: [
      Number(expiringStats.value.expiring_in_7_days || 0),
      Number(expiringStats.value.expiring_in_30_days || 0),
      Number(expiringStats.value.expiring_in_60_days || 0),
    ],
  },
])
const tokenAssignedSeries = computed(() => [
  {
    name: t('dashboard.tokens.assigned'),
    data: [Number(tokenOverview.value.assigned || 0)],
  },
  {
    name: t('dashboard.tokens.unassigned'),
    data: [Number(tokenOverview.value.unassigned || 0)],
  },
])
const tokenActiveSeries = computed(() => [
  Number(tokenOverview.value.active || 0),
  Number(tokenOverview.value.inactive || 0),
])
const tokenActiveLabels = computed(() => [
  t('dashboard.tokens.active'),
  t('dashboard.tokens.inactive'),
])
const certificateKpis = computed(() => [
  { key: 'total', title: t('dashboard.kpi.total'), value: Number(certificateOverview.value.total || 0), color: 'primary', icon: 'tabler-file-certificate' },
  { key: 'active', title: t('dashboard.kpi.active'), value: Number(certificateOverview.value.active || 0), color: 'success', icon: 'tabler-circle-check' },
  { key: 'revoked', title: t('dashboard.kpi.revoked'), value: Number(certificateOverview.value.revoked || 0), color: 'error', icon: 'tabler-circle-x' },
  { key: 'updated', title: t('dashboard.kpi.updated'), value: Number(certificateOverview.value.updated || 0), color: 'info', icon: 'tabler-refresh' },
  { key: 'imported', title: t('dashboard.kpi.imported'), value: Number(certificateOverview.value.imported || 0), color: 'warning', icon: 'tabler-download' },
])
const hasUrgentRows = computed(() => Array.isArray(expiringStats.value.urgent_list) && expiringStats.value.urgent_list.length > 0)
const urgentTableOptions = ref({
  page: 1,
  itemsPerPage: 5,
})
const urgentPaginationLength = computed(() => {
  const perPage = Math.max(1, Number(urgentTableOptions.value.itemsPerPage || 5))
  const total = expiringStats.value.urgent_list.length

  return Math.max(1, Math.ceil(total / perPage))
})
const paginatedUrgentRows = computed(() => {
  const page = Math.max(1, Number(urgentTableOptions.value.page || 1))
  const perPage = Math.max(1, Number(urgentTableOptions.value.itemsPerPage || 5))
  const start = (page - 1) * perPage

  return expiringStats.value.urgent_list.slice(start, start + perPage)
})

const chartOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
    parentHeightOffset: 0,
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      horizontal: false,
      columnWidth: '45%',
      distributed: true,
    },
  },
  colors: ['#696CFF', '#00CFE8', '#28C76F', '#FF9F43'],
  dataLabels: { enabled: false },
  legend: { show: false },
  xaxis: {
    categories: chartLabels.value,
    labels: {
      style: {
        fontSize: '12px',
      },
    },
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
    labels: {
      formatter: value => `${Math.round(value)}`,
    },
  },
  grid: {
    strokeDashArray: 7,
    padding: {
      left: 0,
      right: 0,
    },
  },
  tooltip: {
    y: {
      formatter: value => `${value} ${t('dashboard.chart.count_unit')}`,
    },
  },
}))
const statusMixOptions = computed(() => ({
  chart: {
    type: 'donut',
    toolbar: { show: false },
  },
  labels: statusMixLabels.value,
  colors: ['#28C76F', '#EA5455', '#00CFE8', '#FF9F43'],
  legend: {
    position: 'bottom',
  },
  dataLabels: {
    enabled: true,
  },
  stroke: {
    width: 2,
  },
}))
const expiringOptions = computed(() => ({
  chart: {
    type: 'bar',
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      borderRadius: 6,
      columnWidth: '45%',
      distributed: true,
    },
  },
  colors: ['#EA5455', '#FF9F43', '#28C76F'],
  dataLabels: { enabled: false },
  legend: { show: false },
  xaxis: {
    categories: expiringCategories.value,
  },
  yaxis: {
    min: 0,
    forceNiceScale: true,
    labels: {
      formatter: value => `${Math.round(value)}`,
    },
  },
  tooltip: {
    y: {
      formatter: value => `${Math.round(value)} ${t('dashboard.chart.series_name')}`,
    },
  },
}))
const tokenAssignedOptions = computed(() => ({
  chart: {
    type: 'bar',
    stacked: true,
    toolbar: { show: false },
  },
  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 5,
      barHeight: '45%',
    },
  },
  colors: ['#696CFF', '#A8AAAE'],
  dataLabels: { enabled: false },
  xaxis: {
    categories: [t('dashboard.tokens.total')],
  },
  legend: {
    position: 'bottom',
  },
}))
const tokenActiveOptions = computed(() => ({
  chart: {
    type: 'donut',
    toolbar: { show: false },
  },
  labels: tokenActiveLabels.value,
  colors: ['#28C76F', '#EA5455'],
  legend: {
    position: 'bottom',
  },
  dataLabels: {
    enabled: true,
  },
}))

const extractPayload = res => res?.data ?? res?.result ?? res ?? {}
const extractErrorMessage = (error, fallbackKey) => error?.data?.detail || error?.response?._data?.detail || t(fallbackKey)
const normalizeNumber = value => Number(value || 0)
const formatCertDate = value => {
  if (!value)
    return '-'
  const date = new Date(value)

  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString()
}
const daysLeftColor = days => {
  const value = Number(days)
  if (value <= 7)
    return 'error'
  if (value <= 30)
    return 'warning'

  return 'success'
}
const daysLeftLabel = days => t('dashboard.expiring.days_left_label', { count: Number(days || 0) })

async function fetchCertificatesCountByType() {
  chartLoading.value = true
  chartError.value = ''

  const endpoints = [
    'requests/certificates/count-by-type/',
  ]

  let lastError = null

  for (const endpoint of endpoints) {
    try {
      const res = await $api(endpoint)
      const payload = extractPayload(res)

      certificatesByType.value = {
        internet_bank: normalizeNumber(payload.internet_bank),
        mobile_bank: normalizeNumber(payload.mobile_bank),
        iABS: normalizeNumber(payload.iABS ?? payload.bank_employee),
        other: normalizeNumber(payload.other),
      }

      chartLoading.value = false

      return
    }
    catch (error) {
      lastError = error
    }
  }

  chartError.value = extractErrorMessage(lastError, 'dashboard.chart.load_error')
  chartLoading.value = false
}

async function fetchCertificateOverview() {
  sectionErrors.value.certificates_overview = ''
  try {
    const res = await $api('certificates/stats/overview/')
    const payload = extractPayload(res)
    certificateOverview.value = {
      total: normalizeNumber(payload.total),
      active: normalizeNumber(payload.active),
      revoked: normalizeNumber(payload.revoked),
      updated: normalizeNumber(payload.updated),
      imported: normalizeNumber(payload.imported),
    }
  }
  catch (error) {
    sectionErrors.value.certificates_overview = extractErrorMessage(error, 'dashboard.kpi.load_error')
  }
}

async function fetchCertificateExpiring() {
  sectionErrors.value.certificates_expiring = ''
  try {
    const res = await $api('certificates/stats/expiring/', {
      query: { limit: 10 },
    })
    const payload = extractPayload(res)
    expiringStats.value = {
      expiring_in_7_days: normalizeNumber(payload.expiring_in_7_days),
      expiring_in_30_days: normalizeNumber(payload.expiring_in_30_days),
      expiring_in_60_days: normalizeNumber(payload.expiring_in_60_days),
      urgent_count: normalizeNumber(payload.urgent_count),
      urgent_list: Array.isArray(payload.urgent_list) ? payload.urgent_list : [],
    }
  }
  catch (error) {
    sectionErrors.value.certificates_expiring = extractErrorMessage(error, 'dashboard.expiring.load_error')
  }
}

async function fetchTokenOverview() {
  sectionErrors.value.tokens_overview = ''
  try {
    const res = await $api('tokens/stats/overview/')
    const payload = extractPayload(res)
    tokenOverview.value = {
      total: normalizeNumber(payload.total),
      assigned: normalizeNumber(payload.assigned),
      unassigned: normalizeNumber(payload.unassigned),
      active: normalizeNumber(payload.active),
      inactive: normalizeNumber(payload.inactive),
    }
  }
  catch (error) {
    sectionErrors.value.tokens_overview = extractErrorMessage(error, 'dashboard.tokens.load_error')
  }
}

async function fetchDashboardStats() {
  dashboardLoading.value = true
  await Promise.allSettled([
    fetchCertificatesCountByType(),
    fetchCertificateOverview(),
    fetchCertificateExpiring(),
    fetchTokenOverview(),
  ])
  dashboardLoading.value = false
}

watch(() => expiringStats.value.urgent_list, () => {
  if (urgentTableOptions.value.page > urgentPaginationLength.value)
    urgentTableOptions.value.page = urgentPaginationLength.value
})

watch(() => urgentTableOptions.value.itemsPerPage, () => {
  urgentTableOptions.value.page = 1
})

onMounted(fetchDashboardStats)
</script>

<template>
  <VRow>
    <VCol cols="12">
      <div class="d-flex align-center justify-space-between mb-2">
        <p class="text-22 mb-0">
          {{ t('dashboard.title') }}
        </p>
        <VBtn
          color="primary"
          variant="tonal"
          prepend-icon="tabler-refresh"
          :loading="dashboardLoading"
          @click="fetchDashboardStats"
        >
          {{ t('dashboard.refresh') }}
        </VBtn>
      </div>
    </VCol>

    <VCol
      v-for="item in certificateKpis"
      :key="item.key"
      cols="12"
      sm="6"
      md="4"
      lg="2"
    >
      <VCard>
        <VCardText class="d-flex align-center">
          <VAvatar
            :color="item.color"
            variant="tonal"
            class="me-3"
          >
            <VIcon :icon="item.icon" />
          </VAvatar>
          <div>
            <div class="text-h6 mb-0">{{ item.value }}</div>
            <div class="text-medium-emphasis text-body-2">{{ item.title }}</div>
          </div>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" md="8">
      <VCard class="h-100">
        <VCardItem>
          <VCardTitle>{{ t('dashboard.chart.title') }}</VCardTitle>
          <template #append>
            <VChip color="primary" variant="tonal">
              {{ t('dashboard.chart.total') }}: {{ totalCertificates }}
            </VChip>
          </template>
        </VCardItem>
        <VCardText>
          <VAlert
            v-if="chartError"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ chartError }}
          </VAlert>
          <div
            v-if="chartLoading"
            class="d-flex justify-center py-10"
          >
            <VProgressCircular indeterminate color="primary" />
          </div>
          <VueApexCharts
            v-else
            type="bar"
            height="340"
            :options="chartOptions"
            :series="chartSeries"
          />
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" md="4">
      <VCard class="h-100">
        <VCardItem>
          <VCardTitle>{{ t('dashboard.kpi.mix_title') }}</VCardTitle>
        </VCardItem>
        <VCardText>
          <VAlert
            v-if="sectionErrors.certificates_overview"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ sectionErrors.certificates_overview }}
          </VAlert>
          <VueApexCharts
            type="donut"
            height="320"
            :options="statusMixOptions"
            :series="statusMixSeries"
          />
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" md="6">
      <VCard class="h-100">
        <VCardItem>
          <VCardTitle>{{ t('dashboard.expiring.title') }}</VCardTitle>
        </VCardItem>
        <VCardText>
          <VAlert
            v-if="sectionErrors.certificates_expiring"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ sectionErrors.certificates_expiring }}
          </VAlert>
          <VueApexCharts
            type="bar"
            height="320"
            :options="expiringOptions"
            :series="expiringSeries"
          />
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" md="6">
      <VCard class="h-100">
        <VCardItem>
          <VCardTitle>{{ t('dashboard.tokens.title') }}</VCardTitle>
          <template #append>
            <VChip color="primary" variant="tonal">
              {{ t('dashboard.tokens.total') }}: {{ tokenOverview.total }}
            </VChip>
          </template>
        </VCardItem>
        <VCardText>
          <VAlert
            v-if="sectionErrors.tokens_overview"
            type="error"
            variant="tonal"
            class="mb-4"
          >
            {{ sectionErrors.tokens_overview }}
          </VAlert>
          <VueApexCharts
            type="bar"
            height="170"
            :options="tokenAssignedOptions"
            :series="tokenAssignedSeries"
          />
          <VueApexCharts
            type="donut"
            height="170"
            :options="tokenActiveOptions"
            :series="tokenActiveSeries"
          />
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12">
      <VCard>
        <VCardItem>
          <VCardTitle>{{ t('dashboard.expiring.urgent_title') }}</VCardTitle>
          <template #append>
            <AppSelect
              v-if="hasUrgentRows"
              :model-value="urgentTableOptions.itemsPerPage"
              :items="[
                { value: 5, title: '5' },
                { value: 10, title: '10' },
                { value: 20, title: '20' },
              ]"
              density="compact"
              hide-details
              style="inline-size: 5.5rem;"
              @update:model-value="urgentTableOptions.itemsPerPage = parseInt($event, 10)"
            />
          </template>
        </VCardItem>
        <VCardText>
          <VTable density="comfortable">
            <thead>
              <tr>
                <th>{{ t('dashboard.expiring.columns.cert_sn') }}</th>
                <th>{{ t('dashboard.expiring.columns.cert_to') }}</th>
                <th>{{ t('dashboard.expiring.columns.days_left') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="item in paginatedUrgentRows"
                :key="item.id || item.cert_sn"
              >
                <td>{{ item.cert_sn || '-' }}</td>
                <td>{{ formatCertDate(item.cert_to) }}</td>
                <td>
                  <VChip
                    size="small"
                    :color="daysLeftColor(item.days_left)"
                    variant="tonal"
                  >
                    {{ daysLeftLabel(item.days_left) }}
                  </VChip>
                </td>
              </tr>
              <tr v-if="!hasUrgentRows">
                <td
                  colspan="3"
                  class="text-center text-medium-emphasis py-6"
                >
                  {{ t('no_data') }}
                </td>
              </tr>
            </tbody>
          </VTable>
          <div
            v-if="hasUrgentRows"
            class="d-flex justify-end mt-4"
          >
            <VPagination
              v-model="urgentTableOptions.page"
              :length="urgentPaginationLength"
              :total-visible="$vuetify.display.smAndDown ? 3 : 5"
            />
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
