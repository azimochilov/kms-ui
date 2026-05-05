<script setup>
import { useToast } from '@/@core/stores/toastConfig'
import { useUsers } from '@/@core/stores/users'
import { useI18n } from 'vue-i18n'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'



const store = useUsers()
const storeToast = useToast()
const { t } = useI18n()



const props = defineProps({
  isDrawerOpen: {
    type: Boolean,
    required: true,
  },
  update_dataId: {
    type: Number || null,
    default: null
  }
})

const emit = defineEmits([
  'update:isDrawerOpen',
  'update:update_dataId',
  'refresh'
])

const isFormValid = ref(false)
const refForm = ref()







const userData = ref({
  username: null,
  email: null,
  f_name: null,
  l_name: null,
  password: null,
  type: null,
  active: true,
  branch: null,
  mfo: null

})
const isPasswordVisible = ref(false)

const handleSuccess = () => {
  storeToast.successToast(t('success'))
  emit('update:isDrawerOpen', false)
  emit('update:update_dataId', null)
  emit('refresh')
  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()
  })
}

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:isDrawerOpen', false)
  emit('update:update_dataId', null)
  nextTick(() => {
    refForm.value?.reset()
    userData.value.status = true
    refForm.value?.resetValidation()
  })
}

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    console.log(refForm.value);


    if (valid) {
      if (!props.update_dataId) {
        store.createUser(userData.value)
          .then(res => {

            handleSuccess()



          }).catch(error => {
            storeToast.errorToast(error.response._data.message)
          })
      } else {

        store.updateUsers(props.update_dataId, userData.value)
          .then(() => {

            handleSuccess()
          }).catch(error => {
            storeToast.errorsNotfications(error.response._data.errors)
          })
      }



    } else {
      storeToast.errorToast(t('required_fiels'))


    }
  })
}

const handleDrawerModelValueUpdate = val => {
  emit('update:isDrawerOpen', val)
  emit('update:update_dataId', null)
  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()
  })
}


// Watcher to update the form fields when props.update_data change  s
watch(() => props.update_dataId, (id) => {
  if (id) {
    store.fetOneUser(id).then(res => {
      let data = res.result
      userData.value = {
        username: data.username || null,
        email: data.email || null,
        f_name: data.f_name || null,
        l_name: data.l_name || null,
        type: data.type || null,
        active: data.status == 1 ? true : false,
        mfo: data.mfo,
        branch: data.branch
      }

    })





  }
}, { immediate: true })
</script>

<template>
  <VNavigationDrawer temporary :width="400" location="end" class="scrollable-content" :model-value="props.isDrawerOpen"
    @update:model-value="handleDrawerModelValueUpdate">
    <!-- 👉 Title -->
    <AppDrawerHeaderSection :title="!props.update_dataId ? $t('settingsModule.add') : $t('settingsModule.edit')"
      @cancel="closeNavigationDrawer" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>


          <!-- 👉 Form -->
          <VForm ref="refForm" v-model="isFormValid" @submit.prevent="onSubmit">
            <VRow>



              <!-- 👉 Username -->
              <VCol cols="12">
                <AppTextField v-model="userData.username" :rules="[requiredValidator]"
                  :label="$t('settingsModule.username')" :requireInput="true" />
              </VCol>

              <!-- password -->

              <VCol cols="12" v-if="!props.update_dataId">
                <AppTextField v-model="userData.password" :label="$t('login.password')" placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" :requireInput="true"
                  :rules="!props.update_dataId ? [] : [requiredValidator, minLengthValidator(userData.password, 8)]" />
              </VCol>


              <!-- 👉 f_name -->
              <VCol cols="12">
                <AppTextField v-model="userData.f_name" :label="$t('settingsModule.firstname')" />
              </VCol>


              <!-- 👉 s_name -->
              <VCol cols="12">
                <AppTextField v-model="userData.l_name" :label="$t('settingsModule.surname')" />
              </VCol>

              <!-- 👉 Email -->
              <VCol cols="12">
                <AppTextField v-model="userData.email" :rules="[emailValidator]"
                  :label="$t('settingsModule.emai_address')" />
              </VCol>

              <!-- 👉 Role -->
              <VCol cols="12">
                <AppSelect v-model="userData.type" :label="$t('settingsModule.user_type')" :rules="[requiredValidator]"
                  :items="['user', 'admin', 'limited', 'operator']" :requireInput="true" />
              </VCol>


              <!-- 👉 filal -->
              <VCol cols="12">
                <AppTextField v-model="userData.branch" :label="$t('settingsModule.branch')" />
              </VCol>



              <!-- 👉 MFO -->
              <VCol cols="12">
                <AppTextField v-model="userData.mfo" :label="$t('settingsModule.mfo')" type="number"
                  :rules="[minLengthValidator(userData.mfo, 5), maxLengthValidator(userData.mfo, 5)]" />
              </VCol>


              <!-- status -->
              <VCol class="d-flex  justify-space-between" v-if="props.update_dataId">
                <div>{{ $t('settingsModule.activity') }}</div>
                <VSwitch v-model="userData.active" />

              </VCol>


              <!-- 👉 Submit and Cancel -->
              <VCol cols="12">
                <VBtn type="submit" class="me-3">
                  {{ $t('settingsModule.send') }}
                </VBtn>

              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
