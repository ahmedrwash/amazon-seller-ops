import { useAuth } from '@/context/AuthContext';
import { useMemo } from 'react';

export const useAuthorization = () => {
  const { 
    user,
    profile, 
    allowedMarketplaceIds,
    canManageUsers,
    canManageFinance,
    hasMarketplaceAccess,
    canEditRecord,
    canDeleteRecord,
    canApproveFinance
  } = useAuth();

  const isAdmin = profile?.role === 'Admin';
  const isFinance = profile?.role === 'Finance' || isAdmin;
  const isOps = profile?.role === 'Ops' || isAdmin;
  const isViewer = profile?.role === 'Viewer';

  return {
    user,
    profile,
    isAdmin,
    isFinance,
    isOps,
    isViewer,
    allowedMarketplaceIds,
    canManageUsers, // Specific permission toggle
    canManageFinance, // Specific permission toggle
    
    // Methods
    hasMarketplaceAccess,
    canEditRecord,
    canDeleteRecord,
    canApproveFinance,
    
    // Helper to check if current user is the owner/creator
    isOwner: (record) => record?.owner_id === user?.id || record?.created_by === user?.id,
  };
};