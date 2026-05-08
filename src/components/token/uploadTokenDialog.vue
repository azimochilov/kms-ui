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

const file = ref(null)
const loading = ref(false)
const dragOver = ref(false)
const fileInput = ref(null)

const selectedFileName = computed(() => file.value?.name || '')

const onFileChange = (e) => {
  const selected = e.target.files[0]
  if (selected && selected.name.endsWith('.csv')) {
    file.value = selected
  } else {
    storeToast.errorsNotfications([t('tokenModule.only_csv')])
  }
}

const onDrop = (e) => {
  dragOver.value = false
  const dropped = e.dataTransfer.files[0]
  if (dropped && dropped.name.endsWith('.csv')) {
    file.value = dropped
  } else {
    storeToast.errorsNotfications([t('tokenModule.only_csv')])
  }
}

const submit = async () => {
  if (!file.value) {
    storeToast.errorsNotfications([t('tokenModule.select_file')])
    return
  }
  loading.value = true
  try {
    const res = await store.uploadTokens(file.value)
    storeToast.successToast(t('tokenModule.upload_success', { count: res.created }))
    file.value = null
    isOpen.value = false
    emit('refresh')
  } catch (error) {
    storeToast.errorsNotfications(error.response?._data?.errors || [t('tokenModule.upload_error')])
  } finally {
    loading.value = false
  }
}

const close = () => {
  file.value = null
  isOpen.value = false
}
</script>

<template>
  <VDialog v-model="isOpen" max-width="480" persistent>
    <VCard>
      <VCardTitle class="d-flex align-center justify-space-between pa-4">
        <span class="text-h6">
          <VIcon icon="tabler-upload" class="me-2" />
          {{ $t('tokenModule.upload_csv') }}
        </span>
        <VBtn icon variant="text" size="small" @click="close">
          <VIcon icon="tabler-x" />
        </VBtn>
      </VCardTitle>

      <VDivider />

      <VCardText class="pa-5">
        <!-- Drop zone -->
        <div
          class="drop-zone rounded-lg pa-6 text-center"
          :class="{ 'drag-active': dragOver, 'has-file': !!file }"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop.prevent="onDrop"
          @click="fileInput?.click()"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".csv"
            class="d-none"
            @change="onFileChange"
          />

          <VIcon
            :icon="file ? 'tabler-file-check' : 'tabler-file-upload'"
            size="48"
            :color="file ? 'success' : 'primary'"
            class="mb-3"
          />

          <p v-if="!file" class="text-body-1 mb-1 text-medium-emphasis">
            {{ $t('tokenModule.drag_or_click') }}
          </p>
          <p v-if="!file" class="text-caption text-disabled">
            {{ $t('tokenModule.only_csv') }}
          </p>

          <p v-if="file" class="text-body-1 font-weight-medium text-success mb-0">
            {{ selectedFileName }}
          </p>
        </div>

        <!-- CSV format hint -->
        <VAlert type="info" variant="tonal" density="compact" class="mt-4 text-caption">
          {{ $t('tokenModule.csv_hint') }}
          <code>seria_number</code> {{ $t('tokenModule.csv_hint2') }}
          <code>serial_number</code>
        </VAlert>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4 gap-2">
        <VSpacer />
        <VBtn variant="tonal" @click="close">{{ $t('cancel') }}</VBtn>
        <VBtn
          color="success"
          :loading="loading"
          :disabled="!file"
          @click="submit"
        >
          <VIcon icon="tabler-upload" class="me-1" />
          {{ $t('tokenModule.upload') }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
.drop-zone {
  border: 2px dashed rgba(var(--v-theme-primary), 0.4);
  cursor: pointer;
  transition: all 0.2s ease;
  min-height: 140px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.drop-zone:hover,
.drag-active {
  border-color: rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-primary), 0.05);
}
.has-file {
  border-color: rgb(var(--v-theme-success));
  background: rgba(var(--v-theme-success), 0.05);
}
.gap-2 { gap: 8px; }
</style>
