import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roleConstants';

export const useAdminCheck = () => {
  const { profile, loading, user } = useAuth();

  // Use the profile from context which handles fallback logic safely.
  // We also check user metadata as a secondary fallback if profile is missing but user exists.
  const isAdmin = 
    profile?.role === ROLES.ADMIN || 
    user?.user_metadata?.role === ROLES.ADMIN;

  return { 
    isAdmin, 
    loading, 
    error: null 
  };
};