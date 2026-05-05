<script setup>
import { useToast } from '@/@core/stores/toastConfig'
import avatar1 from '@images/avatars/avatar-1.png'

definePage({
  meta: {
    action: 'read',
    subject: 'AclDemo',
  },
})

const toast = useToast()

const loading = ref(false)
const savingProfile = ref(false)
const savingPassword = ref(false)
const avatarFile = ref(null)
const avatarPreview = ref(null)
const avatarInput = ref(null)

const profileForm = ref({
  username: '',
  first_name: '',
  last_name: '',
  email: '',
  role: '',
  avatar_url: null,
})

const isAdmin = computed(() => profileForm.value.role === 'admin')

const passwordForm = ref({
  old_password: '',
  new_password: '',
  new_password_confirm: '',
})

const loadProfile = async () => {
  loading.value = true
  try {
    const res = await $api('users/profile', { method: 'GET' })

    profileForm.value = {
      username: res?.username ?? '',
      first_name: res?.first_name ?? '',
      last_name: res?.last_name ?? '',
      email: res?.email ?? '',
      role: res?.role ?? '',
      avatar_url: res?.avatar_url ?? null,
    }

    useCookie('userData').value = res
  }
  catch (error) {
    const message = error?.response?._data?.message ?? error?.message ?? 'Failed to load profile'
    toast.errorToast(message)
  }
  finally {
    loading.value = false
  }
}

const updateProfile = async () => {
  savingProfile.value = true
  try {
    const payload = new FormData()
    payload.append('first_name', profileForm.value.first_name)
    payload.append('last_name', profileForm.value.last_name)
    if (isAdmin.value) {
      payload.append('username', profileForm.value.username)
      payload.append('email', profileForm.value.email)
    }
    if (avatarFile.value)
      payload.append('avatar', avatarFile.value)

    const res = await $api('users/profile', {
      method: 'PATCH',
      body: payload,
    })

    useCookie('userData').value = res
    profileForm.value.avatar_url = res?.avatar_url ?? profileForm.value.avatar_url
    avatarFile.value = null
    avatarPreview.value = null
    toast.successToast('Profile updated')
  }
  catch (error) {
    const message = error?.response?._data?.message ?? error?.message ?? 'Failed to update profile'
    toast.errorToast(message)
  }
  finally {
    savingProfile.value = false
  }
}

const onAvatarChange = (event) => {
  const file = event?.target?.files?.[0]
  if (!file) {
    avatarFile.value = null
    avatarPreview.value = null
    return
  }
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

const openAvatarPicker = () => {
  avatarInput.value?.click()
}

const changePassword = async () => {
  if (passwordForm.value.new_password !== passwordForm.value.new_password_confirm) {
    toast.errorToast('New passwords do not match')
    return
  }

  savingPassword.value = true
  try {
    const res = await $api('users/change-password', {
      method: 'POST',
      body: {
        old_password: passwordForm.value.old_password,
        new_password: passwordForm.value.new_password,
      },
    })

    toast.successToast(res?.message ?? 'Password updated')
    passwordForm.value = {
      old_password: '',
      new_password: '',
      new_password_confirm: '',
    }
  }
  catch (error) {
    const message = error?.response?._data?.message ?? error?.message ?? 'Failed to change password'
    toast.errorToast(message)
  }
  finally {
    savingPassword.value = false
  }
}

onMounted(() => {
  loadProfile()
})
</script>

<template>
  <VRow>
    <VCol cols="12" md="7">
      <VCard title="Profile">
        <VCardText>
          <VForm @submit.prevent="updateProfile">
            <VRow>
              <VCol cols="12" class="d-flex align-center gap-4">
                <VAvatar size="72" color="primary" variant="tonal">
                  <VImg :src="avatarPreview || profileForm.avatar_url || avatar1" />
                </VAvatar>
                <input
                  ref="avatarInput"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="onAvatarChange"
                >
                <VBtn
                  variant="tonal"
                  prepend-icon="tabler-camera"
                  :disabled="loading || savingProfile"
                  @click="openAvatarPicker"
                >
                  Change photo
                </VBtn>
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="profileForm.first_name"
                  label="First name"
                  :disabled="loading || savingProfile"
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="profileForm.last_name"
                  label="Last name"
                  :disabled="loading || savingProfile"
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="profileForm.username"
                  label="Username"
                  :readonly="!isAdmin"
                  :disabled="loading || savingProfile"
                />
              </VCol>

              <VCol cols="12" md="6">
                <AppTextField
                  v-model="profileForm.email"
                  label="Email"
                  type="email"
                  :readonly="!isAdmin"
                  :disabled="loading || savingProfile"
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  type="submit"
                  :loading="savingProfile"
                  :disabled="loading"
                >
                  Save profile
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>

    <VCol cols="12" md="5">
      <VCard title="Change password">
        <VCardText>
          <VForm @submit.prevent="changePassword">
            <VRow>
              <VCol cols="12">
                <AppTextField
                  v-model="passwordForm.old_password"
                  label="Old password"
                  type="password"
                  :disabled="savingPassword"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="passwordForm.new_password"
                  label="New password"
                  type="password"
                  :disabled="savingPassword"
                />
              </VCol>

              <VCol cols="12">
                <AppTextField
                  v-model="passwordForm.new_password_confirm"
                  label="Confirm new password"
                  type="password"
                  :disabled="savingPassword"
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  type="submit"
                  :loading="savingPassword"
                >
                  Update password
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
