<script setup>
import avatar1 from '@images/avatars/avatar-1.png'
const { t } = useI18n()

const userCookie = useCookie('userData')
const profile = ref(userCookie.value || {})

const fullName = computed(() => {
  const firstName = profile.value?.first_name || ''
  const lastName = profile.value?.last_name || ''
  const name = `${firstName} ${lastName}`.trim()

  return name || profile.value?.username || 'User'
})

const roleLabel = computed(() => profile.value?.role || 'User')
const avatarSrc = computed(() => profile.value?.avatar_url || avatar1)

const loadProfile = async () => {
  try {
    const res = await $api('users/profile', { method: 'GET' })

    profile.value = res
    userCookie.value = res
  }
  catch (error) {
    profile.value = userCookie.value || {}
  }
}

onMounted(() => {
  loadProfile()
})

const logout = () => {
  // cooke storeoge remove 
  useCookie('userAbilityRules').value = null
  useCookie('userData').value = null
  useCookie('accessToken').value = null

}
</script>

<template>
  <VBadge dot location="bottom right" offset-x="3" offset-y="3" bordered color="success">
    <VAvatar class="cursor-pointer" color="primary" variant="tonal">
      <VImg :src="avatarSrc" />

      <!-- SECTION Menu -->
      <VMenu activator="parent" width="230" location="bottom end" offset="14px">
        <VList>
          <!-- 👉 User Avatar & Name -->
          <VListItem>
            <template #prepend>
              <VListItemAction start>
                <VBadge dot location="bottom right" offset-x="3" offset-y="3" color="success">
                  <VAvatar color="primary" variant="tonal">
                    <VImg :src="avatarSrc" />
                  </VAvatar>
                </VBadge>
              </VListItemAction>
            </template>

            <VListItemTitle class="font-weight-semibold">
              {{ fullName }}
            </VListItemTitle>
            <VListItemSubtitle>{{ roleLabel }}</VListItemSubtitle>
          </VListItem>

          <VDivider class="my-2" />

          <!-- 👉 Profile -->
          <VListItem to="/profile">
            <template #prepend>
              <VIcon class="me-2" icon="tabler-user" size="22" />
            </template>

            <VListItemTitle>{{ t('profile_menu.profile') }}</VListItemTitle>
          </VListItem>

          <VListItem to="/faq">
            <template #prepend>
              <VIcon class="me-2" icon="tabler-help" size="22" />
            </template>

            <VListItemTitle>FAQ</VListItemTitle>
          </VListItem>

          <!-- Divider -->
          <VDivider class="my-2" />

          <!-- 👉 Logout -->
          <VListItem to="/login">
            <template #prepend>
              <VIcon class="me-2" icon="tabler-logout" size="22" />
            </template>

            <VListItemTitle @click="logout">{{ t('profile_menu.logout') }}</VListItemTitle>
          </VListItem>
        </VList>
      </VMenu>
      <!-- !SECTION -->
    </VAvatar>
  </VBadge>
</template>
