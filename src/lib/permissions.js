
import { supabase } from './customSupabaseClient';

const roleCache = new Map();

export function isPrimaryAdmin(email) {
  return !!email && email.toLowerCase() === 'ahmedrwash@gmail.com';
}

export async function getUserRole(userId) {
  if (!userId) return 'viewer';

  if (roleCache.has(userId)) {
    return roleCache.get(userId);
  }

  try {
    // profiles is the single source of truth (also enforced by RLS).
    const { data, error } = await supabase
      .from('profiles')
      .select('role, email, active')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // Fail closed: never grant edit rights on an error.
      console.warn(`[Permissions] Error fetching role for ${userId}, defaulting to 'viewer':`, error.message);
      return 'viewer';
    }

    // Inactive accounts have no effective role.
    if (data && data.active === false && !isPrimaryAdmin(data?.email)) {
      roleCache.set(userId, 'viewer');
      return 'viewer';
    }

    const role = isPrimaryAdmin(data?.email) ? 'admin' : (data?.role || 'viewer');
    roleCache.set(userId, role);
    return role;
  } catch (error) {
    console.warn('[Permissions] Exception in getUserRole, defaulting to viewer:', error);
    return 'viewer';
  }
}

export async function isAdmin(userId) {
  const role = await getUserRole(userId);
  return role === 'admin';
}

export async function canCreateProducts(userId) {
  const role = await getUserRole(userId);
  return ['admin', 'editor', 'collaborator'].includes(role);
}

export async function canEditProducts(userId) {
  const role = await getUserRole(userId);
  return ['admin', 'editor', 'collaborator'].includes(role);
}

export async function canEditWeeklyData(userId) {
  const role = await getUserRole(userId);
  return ['admin', 'editor', 'collaborator'].includes(role);
}

export async function canCreateTasks(userId) {
  const role = await getUserRole(userId);
  return ['admin', 'editor', 'collaborator'].includes(role);
}

export async function canManageUsers(userId) {
  const role = await getUserRole(userId);
  return role === 'admin';
}

export async function canViewProducts(userId) {
  return true;
}

export function clearRoleCache(userId) {
  if (userId) {
    roleCache.delete(userId);
  } else {
    roleCache.clear();
  }
}
