<script setup>
import {
  HorizontalNavGroup,
  HorizontalNavLink,
} from '@layouts/components'

import NavBarNotifications from '@/layouts/components/NavBarNotifications.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'



const props = defineProps({
  navItems: {
    type: null,
    required: true,
  },
})

const resolveNavItemComponent = item => {
  if ('children' in item)
    return HorizontalNavGroup

  return HorizontalNavLink
}
</script>

<template>

  <ul class="nav-items">
    <RouterLink to="/" class="app-logo d-flex align-center mr-8 gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo" />

      <h1 class="app-title font-weight-bold leading-normal text-xl text-capitalize">
        {{ themeConfig.app.title }}
      </h1>
    </RouterLink>
    <Component :is="resolveNavItemComponent(item)" v-for="(item, index) in navItems" :key="index" :item="item" />

    <VSpacer />

    <NavBarI18n v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
      :languages="themeConfig.app.i18n.langConfig" />


    <NavBarNotifications class="me-2" />

    <!-- <NavbarThemeSwitcher class="me-2" /> -->
    <UserProfile />
  </ul>
</template>

<style lang="scss">
.layout-wrapper.layout-nav-type-horizontal {
  .nav-items {
    display: flex;
    flex-wrap: wrap;
  }
}
</style>
