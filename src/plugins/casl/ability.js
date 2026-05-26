import { createMongoAbility } from '@casl/ability'

// Subjects:
//   AclDemo    → barcha login qilgan foydalanuvchilar (profile, faq, client detail, ...)
//   admin-only → faqat admin (employees, logs)
//   staff      → admin + limited_admin (requests, reports)
//   member     → admin + user + limited_admin (home, clients, tokens)
//   cert       → barcha rollar (certificates)

const rolePermissions = {
    admin:         ['AclDemo', 'admin-only', 'staff', 'member', 'cert'],
    limited_admin: ['AclDemo', 'staff', 'member', 'cert'],
    user:          ['AclDemo', 'member', 'cert'],
    operator:      ['AclDemo', 'cert'],
}

export function getRulesForRole(role) {
    const subjects = rolePermissions[role] || ['AclDemo']
    return subjects.map(subject => ({
        action: 'read',
        subject,
    }))
}

export function defineAbilityFor(role) {
    return createMongoAbility(getRulesForRole(role))
}
