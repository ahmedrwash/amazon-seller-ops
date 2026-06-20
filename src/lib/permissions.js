
import { supabase } from './customSupabaseClient';

const roleCache = new Map();

export function isPrimaryAdmin(email) {
  return email === 'ahmedrwash@hotmail.com';
}

export async function getUserRole(userId) {
  if (!userId) return 'viewer';
  
  if (roleCache.has(userId)) {
    return roleCache.get(userId);
  }
  
  try {
    const { data, error } = await supabase
      .from('user_accounts')
      .select('role, email')
      .eq('auth_id', userId)
      .single();
      
    if (error) {
      console.warn(`[Permissions] Error fetching role for user ${userId}, falling back to 'editor':`, error.message);
      return 'editor';
    }
    
    // Auto-override if primary admin
    const role = isPrimaryAdmin(data?.email) ? 'admin' : (data?.role || 'editor');
    roleCache.set(userId, role);
    return role;
  } catch (error) {
    console.warn('[Permissions] Exception in getUserRole, falling back to editor:', error);
    return 'editor';
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
