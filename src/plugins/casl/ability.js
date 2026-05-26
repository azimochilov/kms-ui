import { createMongoAbility } from '@casl/ability'

// subject map:
//   admin-only  → faqat admin (employees, logs)
//   staff       → admin + limited_admin (requests, reports)
//   member      → admin + user + limited_admin (home, clients, tokens)
//   cert        → barcha rollar (certificates)

const rolePermissions = {
    admin:         ['admin-only', 'staff', 'member', 'cert'],
    limited_admin: ['staff', 'member', 'cert'],
    user:          ['member', 'cert'],
    operator:      ['cert'],
}

export function getRulesForRole(role) {
    const subjects = rolePermissions[role] || []
    return subjects.map(subject => ({
        action: 'read',
        subject,
    }))
}

export function defineAbilityFor(role) {
    return createMongoAbility(getRulesForRole(role))
}
