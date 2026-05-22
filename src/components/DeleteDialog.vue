<template>
    <div>

        <VDialog v-model="props.deleteDialog" max-width="500px">
            <VCard>
                <VCardTitle>
                    {{ $t('common.delete_confirm') }}
                </VCardTitle>

                <VCardActions>
                    <VSpacer />

                    <VBtn color="error" variant="outlined" @click="emit('closeDelete')">
                        {{ $t('cancel') }}
                    </VBtn>

                    <VBtn color="success" variant="elevated" @click="emit('deleteItemConfirm')">
                        {{ $t('common.ok') }}
                    </VBtn>

                    <VSpacer />
                </VCardActions>
            </VCard>
        </VDialog>


    </div>
</template>

<script setup>

const props = defineProps({
    deleteDialog: {
        type: Boolean,
        required: true,
    },

})

const emit = defineEmits([
    'update:deleteDialog',
    'deleteItemConfirm',
    'closeDelete'
])

</script>
