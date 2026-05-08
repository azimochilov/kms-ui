<script setup>
import { useToast } from '@/@core/stores/toastConfig'
import { useTokens } from '@/@core/stores/tokens'
import { useI18n } from 'vue-i18n'

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

const seriaInput = ref('')
const loading = ref(false)
const seriaNumbers = ref([])

// Textarea'dan seria raqamlarini parse qilish
const parsedCount = computed(() => {
  return seriaInput.value
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0).length
})

const submit = async () => {
  const list = seriaInput.value
    .split('\n')
    .map(s => s.trim())
    .filter(s => s.length > 0)

  if (list.length === 0) {
    storeToast.errorsNotfications([t('tokenModule.enter_seria')])
    return
  }

  loading.value = true
  try {
    const res = await store.assignTokens(list)
    storeToast.successToast(
      t('tokenModule.assign_success', { updated: res.updated, total: res.total_requested })
    )
    close()
    emit('refresh')
  } catch (error) {
    storeToast.errorsNotfications(error.response?._data?.errors || [t('tokenModule.assign_error')])
  } finally {
    loading.value = false
  }
}

const close = () => {
  seriaInput.value = ''
  isOpen.value = false
}
</script>

<template>
  <VDialog v-model="isOpen" max-width="480" persistent>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6">
          <VIcon icon="tabler-link" class="me-2" />
          {{ $t('tokenModule.assign') }}
        </span>
        <VBtn icon variant="text" size="small" @click="close">
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5">
        <p class="text-body-2 text-medium-emphasis mb-3">
          {{ $t('tokenModule.assign_hint') }}
        </p>

        <VTextarea
          v-model="seriaInput"
          :label="$t('tokenModule.seria_numbers')"
          :placeholder="$t('tokenModule.seria_placeholder')"
          variant="outlined"
          rows="6"
          no-resize
        />

        <VChip
          v-if="parsedCount > 0"
          color="primary"
          size="small"
          class="mt-2"
        >
          {{ $t('tokenModule.seria_count', { count: parsedCount }) }}
        </VChip>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4">
        <VSpacer />
        <VBtn variant="tonal" @click="close">{{ $t('cancel') }}</VBtn>
        <VBtn
          color="warning"
          :loading="loading"
          :disabled="parsedCount === 0"
          @click="submit"
        >
          <VIcon icon="tabler-link" class="me-1" />
          {{ $t('tokenModule.assign_btn') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
