<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { $api } from '@/utils/api'

const props = defineProps({
    modelValue: Boolean,
    certSn: String,
    isAdmin: Boolean,
})
const emit = defineEmits(['update:modelValue', 'revoked'])
const { t } = useI18n()

const selectedReason = ref(null)
const loading = ref(false)
const error = ref(null)

const reasons = [
    {ru: 'Истек срок действия сертификата', uz: 'Sertifikat muddati tugagan'},
    {ru: 'Потерия токена', uz: 'Token yo\'qolgan'},
    {ru: 'Токен не работает', uz: 'Token ishlamayapti'},
    {ru: 'Удалена лицензия', uz: 'Litsenziya o\'chirilgan'},
    {ru: 'Токен заблокирован', uz: 'Token bloklangan'},
    {ru: 'Смена директора', uz: 'Direktor almashinuvi'},
    {ru: 'Компания закрывает счёт', uz: 'Kompaniya hisobini yopmoqda'},
    {ru: 'Сотрудник банка уволился', uz: 'Bank xodimi ishdan ketgan'},
]

const reasonItems = computed(() =>
    reasons.map(r => ({
        title: `${r.uz} / ${r.ru}`,
        value: r.ru, // backendga rus tilida ketadi
    }))
)

const getApiErrorMessage = e => {
    const rawError = e?.data?.error
        ?? e?.response?._data?.error
        ?? e?.response?.data?.error
        ?? e?.data?.detail
        ?? e?.response?._data?.detail
        ?? e?.response?.data?.detail
        ?? e?.message

    if (typeof rawError === 'string')
        return rawError

    if (rawError && typeof rawError === 'object')
        return String(rawError?.detail ?? rawError?.message ?? '')

    return ''
}

const isPendingRevokeError = message =>
    String(message).toLowerCase().includes('already pending')

const close = () => {
    emit('update:modelValue', false)
    selectedReason.value = null
    error.value = null
}

const submit = async () => {
    if (!selectedReason.value) return

    loading.value = true
    error.value = null

    try {
        // 1-qadam: branch revoke request
        try {
            await $api(`/certificates/${props.certSn}/revoke/`, {
                method: 'POST',
                body: { reason: selectedReason.value },
            })
        } catch (e) {
            const apiMessage = getApiErrorMessage(e)
            const pendingRequest = isPendingRevokeError(apiMessage)

            // Request allaqachon yaratilgan bo'lsa, admin uchun revoke/admin ni davom ettiramiz.
            if (!(props.isAdmin && pendingRequest))
                throw e
        }

        // 2-qadam: agar admin bo'lsa — darhol admin revoke ham qiladi
        if (props.isAdmin) {
            await $api(`/certificates/${props.certSn}/revoke/admin/`, {
                method: 'POST',
            })
        }

        emit('revoked')
        close()
    } catch (e) {
        const apiMessage = getApiErrorMessage(e)
        error.value = isPendingRevokeError(apiMessage)
            ? t('certificates.messages.revoke_already_pending')
            : (apiMessage || t('error'))
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <VDialog :model-value="modelValue" max-width="480" @update:model-value="close">
        <VCard>
            <VCardTitle class="pt-4 px-6">
                Sertifikatni bekor qilish
            </VCardTitle>

            <VCardText class="px-6">
                <VSelect
                    v-model="selectedReason"
                    :items="reasonItems"
                    item-title="title"
                    item-value="value"
                    label="Sabab / Причина"
                    :error-messages="!selectedReason && error ? [error] : []"
                />
                <VAlert v-if="error" type="error" density="compact" class="mt-2">
                    {{ error }}
                </VAlert>
            </VCardText>

            <VCardActions class="px-6 pb-4">
                <VSpacer/>
                <VBtn variant="text" @click="close">Orqaga</VBtn>
                <VBtn
                    color="error"
                    :loading="loading"
                    :disabled="!selectedReason"
                    @click="submit"
                >
                    Bekor qilish
                </VBtn>
            </VCardActions>
        </VCard>
    </VDialog>
</template>
