<template>
    <div>

        <VDialog v-model="props.deleteDialog" max-width="500px">
            <VCard>
                <VCardTitle>
                    Are you sure you want to delete this item?
                </VCardTitle>

                <VCardActions>
                    <VSpacer />

                    <VBtn color="error" variant="outlined" @click="emit('closeDelete')">
                        Cancel
                    </VBtn>

                    <VBtn color="success" variant="elevated" @click="emit('deleteItemConfirm')">
                        OK
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
