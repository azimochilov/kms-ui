import { canNavigate } from '@layouts/plugins/casl'

const isValidUserData = userData => {
  if (!userData || typeof userData !== 'object' || Array.isArray(userData))
    return false

  return !!(userData.username && userData.role)
}

export const setupGuards = router => {
  router.beforeEach(to => {
    if (to.meta.public)
      return

    const userData = useCookie('userData').value
    const accessToken = useCookie('accessToken').value

    const isLoggedIn = !!(isValidUserData(userData) && accessToken)

    if (to.meta.unauthenticatedOnly) {
      if (isLoggedIn)
        return '/'
      else
        return undefined
    }

    if (!isLoggedIn) {
      return {
        name: 'login',
        query: {
          ...to.query,
          to: to.fullPath !== '/' ? to.path : undefined,
        },
      }
    }

    if (!canNavigate(to))
      return { name: 'not-authorized' }
  })
}
