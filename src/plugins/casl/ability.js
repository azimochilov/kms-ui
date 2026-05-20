import { createMongoAbility } from '@casl/ability'

const rolePermissions = {
    admin: ['all', 'admin', 'operator', 'branch'],
    operator: ['all', 'operator'],
    branch: ['all', 'branch', 'operator'],
}

export function getRulesForRole(role) {
    const subjects = rolePermissions[role] || ['all']
    return subjects.map(subject => ({
        action: 'read',
        subject,
    }))
}

export function defineAbilityFor(role) {
    return createMongoAbility(getRulesForRole(role))
}