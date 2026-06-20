import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roleConstants';
import { hasPermission } from '@/utils/roleUtils';

export function useRole() {
  const { profile, user } = useAuth();
  
  // Determine role from profile (primary) or user metadata (fallback)
  const role = profile?.role || user?.user_metadata?.role || ROLES.VIEWER;

  return {
    role,
    isAdmin: role === ROLES.ADMIN,
    isOps: role === ROLES.OPS,
    isFinance: role === ROLES.FINANCE,
    isViewer: role === ROLES.VIEWER,
    hasRole: (requiredRole) => {
      if (role === ROLES.ADMIN) return true; // Admin has all roles essentially
      if (Array.isArray(requiredRole)) return requiredRole.includes(role);
      return role === requiredRole;
    },
    checkPermission: (permission) => hasPermission(role, permission)
  };
}