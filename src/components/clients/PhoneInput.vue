<!-- src/components/common/PhoneInput.vue -->
<script setup>
const props = defineProps({
    modelValue: { type: String, default: '' },
    label: { type: String, default: 'Phone' },
    errorMessages: { type: [String, Array], default: () => [] },
    requireInput: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

// faqat raqamlar, 998 prefixi bilan, max 12 ta raqam
const digits = ref('')

// tashqaridan qiymat kelganda (serverdan yoki edit holatda)
watch(() => props.modelValue, (val) => {
    if (!val) return
    const raw = String(val).replace(/\D/g, '')
    // 998 bilan boshlanadi
    digits.value = raw.startsWith('998') ? raw.slice(3, 12) : raw.slice(0, 9)
}, { immediate: true })

// display uchun mask: 00 000 00 00
const formatted = computed(() => {
    const d = digits.value.padEnd(9, '_')
    return `+998 ${d[0]}${d[1]} ${d[2]}${d[3]}${d[4]} ${d[5]}${d[6]} ${d[7]}${d[8]}`
})

const onInput = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    // 998 prefiksini olib tashlash
    const withoutPrefix = raw.startsWith('998') ? raw.slice(3) : raw
    digits.value = withoutPrefix.slice(0, 9)

    // backga 998XXXXXXXXX formatda
    const full = digits.value.length > 0 ? '998' + digits.value : ''
    emit('update:modelValue', full)
}

const onKeydown = (e) => {
    // faqat raqam, backspace, delete, tab, arrow ruxsat
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
    if (allowed.includes(e.key)) return
    if (!/^\d$/.test(e.key)) e.preventDefault()
}

const isFilled = computed(() => digits.value.length === 9)

const validationRule = () => {
    return isFilled.value || 'Telefon raqamni to\'liq kiriting'
}
</script>

<template>
    <AppTextField
        :model-value="formatted"
        :label="label"
        :requireInput="requireInput"
        :error-messages="errorMessages"
        :rules="[validationRule]"
        inputmode="numeric"
        @input="onInput"
        @keydown="onKeydown"
    />
</template>
