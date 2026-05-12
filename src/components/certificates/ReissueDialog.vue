<script setup>
import { $api } from "@/utils/api";
import { useToast } from '@/@core/stores/toastConfig'

const props = defineProps({
    modelValue: Boolean,
    item: Object,
})
const emit = defineEmits(['update:modelValue', 'reissued'])

const { t } = useI18n()
const storetoast = useToast()

const selectedFile = ref(null)
const loading = ref(false)
const fileInput = ref(null)

const close = () => {
    emit('update:modelValue', false)
    selectedFile.value = null
    loading.value = false
}

const onFileChange = (e) => {
    selectedFile.value = e.target.files[0] || null
}

const submit = async () => {
    if (!selectedFile.value) {
        storetoast.errorToast(t('certificates.reissue.file_required'))
        return
    }

    loading.value = true

    const formData = new FormData()
    formData.append('cert_id', props.item.id)
    formData.append('file', selectedFile.value)

    try {
        await $api('certificates/reissue/', {
            method: 'POST',
            body: formData,
        })
        storetoast.successToast(t('certificates.reissue.success'))
        emit('reissued')
        close()
    } catch (err) {
        storetoast.errorToast(err?.data?.error || t('certificates.reissue.error'))
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <VDialog :model-value="modelValue" max-width="480" @update:model-value="close">
        <VCard>
            <VCardTitle class="pt-5 px-6">
                {{ $t('certificates.reissue.title') }}
            </VCardTitle>

            <VCardText class="px-6">
                <!-- Izoh -->
                <VAlert type="info" variant="tonal" density="compact" class="mb-4">
                    {{ $t('certificates.reissue.hint') }}
                </VAlert>

                <!-- Fayl input -->
                <div
                    class="border rounded pa-4 d-flex flex-column align-center gap-2 cursor-pointer"
                    style="border-style: dashed !important;"
                    @click="fileInput.click()"
                >
                    <VIcon
                        size="36"
                        :icon="selectedFile ? 'tabler-file-check' : 'tabler-file-upload'"
                        :color="selectedFile ? '#28C76F' : '#aaa'"
                    />
                    <span v-if="selectedFile" class="text-success text-sm">
            {{ selectedFile.name }}
          </span>
                    <span v-else class="text-secondary text-sm">
            {{ $t('certificates.reissue.file_placeholder') }}
          </span>
                </div>

                <input
                    ref="fileInput"
                    type="file"
                    accept=".pdf"
                    class="d-none"
                    @change="onFileChange"
                />
            </VCardText>

            <VCardActions class="px-6 pb-5">
                <VSpacer />
                <VBtn variant="text" @click="close">
                    {{ $t('certificates.reissue.cancel') }}
                </VBtn>
                <VBtn
                    color="primary"
                    :loading="loading"
                    :disabled="!selectedFile"
                    @click="submit"
                >
                    {{ $t('certificates.reissue.submit') }}
                </VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>
