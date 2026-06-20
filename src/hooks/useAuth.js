import { useAuth as useContextAuth } from '@/context/AuthContext';

export const useAuth = () => {
  const context = useContextAuth();
  
  return {
    ...context,
    permissions: {
      canManageUsers: context.canManageUsers,
      canManageFinance: context.canManageFinance,
      hasOpsHubAccess: context.hasOpsHubAccess,
    }
  };
};