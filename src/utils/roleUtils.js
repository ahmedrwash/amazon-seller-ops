import { ROLES, ROLE_PERMISSIONS } from '@/constants/roleConstants';

export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(role, permission) {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission) || permissions.includes('view_all');
}

export function formatRole(role) {
  switch (role) {
    case ROLES.ADMIN: return 'Administrator';
    case ROLES.OPS: return 'Operations';
    case ROLES.FINANCE: return 'Finance';
    case ROLES.VIEWER: return 'Viewer';
    default: return role || 'Unknown';
  }
}

export function getProfileFromAuth(user) {
  if (!user) return null;
  return {
    user_id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0],
    role: ROLES.VIEWER, // Default
    active: true
  };
}