import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/hooks/useRole';

export function useRouteGuard(requiredRoles = []) {
  const { user, profile, loading, checkEmailVerified } = useAuth();
  const { role, isAdmin } = useRole();

  if (loading) return { canAccess: false, loading: true };

  // 1. Check Auth
  if (!user) {
    return { canAccess: false, reason: 'unauthenticated' };
  }

  // 2. Check Email Verification
  if (!checkEmailVerified()) {
    return { canAccess: false, reason: 'unverified' };
  }

  // 3. Check Profile Active
  if (profile && !profile.active) {
    return { canAccess: false, reason: 'disabled' };
  }

  // 4. Check Role
  if (requiredRoles.length > 0) {
    // Admin always accesses
    if (isAdmin) return { canAccess: true };
    
    if (!requiredRoles.includes(role)) {
      return { canAccess: false, reason: 'unauthorized' };
    }
  }

  return { canAccess: true };
}