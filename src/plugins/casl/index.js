import { abilitiesPlugin } from '@casl/vue'
import { defineAbilityFor } from './ability'

const savedRole = localStorage.getItem('userRole') || 'guest'

export const ability = defineAbilityFor(savedRole)

export default function (app) {
    app.use(abilitiesPlugin, ability, {
        useGlobalProperties: true,
    })
}