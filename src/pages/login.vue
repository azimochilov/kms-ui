<script setup>
import { useToast } from '@/@core/stores/toastConfig';
import authV1BottomShape from '@images/svg/auth-v1-bottom-shape.svg?raw';
import authV1TopShape from '@images/svg/auth-v1-top-shape.svg?raw';
import { getRulesForRole } from '@/plugins/casl/ability';
import { $api } from '@/utils/api';
import { VNodeRenderer } from '@layouts/components/VNodeRenderer';
import { themeConfig } from '@themeConfig';
import { nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

const store = useToast()
definePage({
  meta:
  {
    layout: 'blank',
    unauthenticatedOnly: true
  }
})

const form = ref({
  username: '',
  password: '',
})

const isPasswordVisible = ref(false)
const { t } = useI18n()


const Tokens = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MX0.fhc3wykrAnRpcKApKhXiahxaOe8PSHatad31NuIZ0Zgwertyytert'
const users = [
  {
    id: 1,
    fullName: 'John Doe',
    username: 'johndoe',
    password: 'admin',
    avatar: `${import.meta.env.BASE_URL ?? '/'}images/avatars/avatar-1.png`,
    login: 'admin@demo.com',
    role: 'admin',
    abilityRules: [
      {
        action: 'manage',
        subject: 'all',
      },
    ],
  },

  {
    id: 2,
    fullName: 'Jane Doe',
    username: 'janedoe',
    password: 'client',
    avatar: `${import.meta.env.BASE_URL ?? '/'}images/avatars/avatar-2.png`,
    login: 'client@demo.com',
    role: 'client',
    abilityRules: [
      {
        action: 'read',
        subject: 'AclDemo',
      },
    ],
  },
]









// const isPasswordVisible = ref(false)
const route = useRoute()
const router = useRouter()
const ability = useAbility()

const errors = ref({
  username: undefined,
  password: undefined,
})

const refVForm = ref()

const credentials = ref({
  login: '',
  password: null
})


const login = () => {
  $api('users/login', {
    method: 'POST',
    body: form.value
  }).then(res => {
    const data = res.user
    const accessToken = res.accessToken ?? res.access
    const role = data.role || 'guest'

    localStorage.setItem('userRole', role)

    const abilityRules = getRulesForRole(role)
    useCookie('userAbilityRules').value = abilityRules
    ability.update(abilityRules)
    useCookie('userData').value = data
    useCookie('accessToken').value = accessToken
    store.successToast(t('success'))
    nextTick(() => {
      router.replace(route.query.to ? String(route.query.to) : '/')
    })

  }).catch(error => {
    store.apiErrorToast(error, t('error'))
  })
}

const onSubmit = () => {
  refVForm.value?.validate().then(({ valid: isValid }) => {
    if (isValid) {
      login()


    }
  })
}







</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <div class="position-relative my-sm-16">
      <!-- 👉 Top shape -->
      <VNodeRenderer :nodes="h('div', { innerHTML: authV1TopShape })"
        class="text-primary auth-v1-top-shape d-none d-sm-block" />

      <!-- 👉 Bottom shape -->
      <VNodeRenderer :nodes="h('div', { innerHTML: authV1BottomShape })"
        class="text-primary auth-v1-bottom-shape d-none d-sm-block" />

      <!-- 👉 Auth Card -->
      <VCard class="auth-card pa-4" max-width="448">
        <VCardItem class="justify-center pb-0">
          <div class="d-flex flex-column align-center gap-2">
            <div style="transform: scale(1.8); margin-bottom: 8px;">
              <VNodeRenderer :nodes="themeConfig.app.logo" />
            </div>
            <span class="text-h6 font-weight-bold text-primary">STYX KMS</span>
          </div>
        </VCardItem>

        <VCardText class="pt-1">
          <h4 class="text-h4 mb-1">
            {{ $t('login.welcome_kms') }}
          </h4>
          <p class="mb-0">
            {{ $t('login.please_log') }}
          </p>
        </VCardText>

        <VCardText>
          <VForm @submit.prevent="onSubmit" ref="refVForm">
            <VRow>
              <!-- login -->
              <VCol cols="12">
                <AppTextField v-model="form.username" :label="$t('login.username')" type="text"
                  :error-messages="errors.login" :placeholder="$t('login.enter_username')"
                  :rules="[requiredValidator]" />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField v-model="form.password" :label="$t('login.password')" placeholder="············"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible" :error-messages="errors.password"
                  :rules="[requiredValidator]" />



                <!-- login button -->
                <VBtn block type="submit" class="mt-6">
                  {{ $t('login.loginButton') }}
                </VBtn>
              </VCol>




            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>
