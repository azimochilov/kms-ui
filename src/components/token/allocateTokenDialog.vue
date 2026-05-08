<script setup>
import { useToast } from '@/@core/stores/toastConfig'
import { useTokens } from '@/@core/stores/tokens'
import { useI18n } from 'vue-i18n'
import { $api } from '@/utils/api'

const props = defineProps({
  isDialogOpen: Boolean,
})
const emit = defineEmits(['update:isDialogOpen', 'refresh'])

const { t } = useI18n()
const storeToast = useToast()
const store = useTokens()

const isOpen = computed({
  get: () => props.isDialogOpen,
  set: (val) => emit('update:isDialogOpen', val),
})

const branchUserId = ref(null)
const quantity = ref(1)
const loading = ref(false)
const branchUsers = ref([])
const loadingUsers = ref(false)

const fetchBranchUsers = async () => {
  loadingUsers.value = true
  try {
    // Branch userlarni olish - o'z proyektingizga moslashtiring
    const res = await $api('users/?role=branch')
    branchUsers.value = res.results || res
  } catch {
    branchUsers.value = []
  } finally {
    loadingUsers.value = false
  }
}

const submit = async () => {
  if (!branchUserId.value || !quantity.value) {
    storeToast.errorsNotfications([t('tokenModule.fill_all')])
    return
  }
  loading.value = true
  try {
    const res = await store.allocateTokens(branchUserId.value, quantity.value)
    storeToast.successToast(t('tokenModule.allocate_success', { count: res.quantity }))
    close()
    emit('refresh')
  } catch (error) {
    storeToast.errorsNotfications(error.response?._data?.errors || [t('tokenModule.allocate_error')])
  } finally {
    loading.value = false
  }
}

const close = () => {
  branchUserId.value = null
  quantity.value = 1
  isOpen.value = false
}

watch(isOpen, (val) => {
  if (val) fetchBranchUsers()
})
</script>

<template>
  <VDialog v-model="isOpen" max-width="460" persistent>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6">
          <VIcon icon="tabler-transfer" class="me-2" />
          {{ $t('tokenModule.allocate') }}
        </span>
        <VBtn icon variant="text" size="small" @click="close">
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5">
        <!-- Branch user tanlash -->
        <VAutocomplete
          v-model="branchUserId"
          :items="branchUsers"
          item-title="username"
          item-value="id"
          :label="$t('tokenModule.branch_user')"
          :loading="loadingUsers"
          :placeholder="$t('tokenModule.select_branch')"
          variant="outlined"
          density="comfortable"
          class="mb-4"
        />

        <!-- Miqdor -->
        <VTextField
          v-model.number="quantity"
          :label="$t('tokenModule.quantity')"
          type="number"
          :min="1"
          variant="outlined"
          density="comfortable"
          :hint="$t('tokenModule.quantity_hint')"
          persistent-hint
        />
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn variant="tonal" @click="close">{{ $t('cancel') }}</VBtn>
        <VBtn
          color="secondary"
          :loading="loading"
          :disabled="!branchUserId || quantity < 1"
          @click="submit"
        >
          <VIcon icon="tabler-send" class="me-1" />
          {{ $t('tokenModule.allocate_btn') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
