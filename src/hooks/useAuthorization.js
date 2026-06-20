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

  const isAdmin = profile?.role === 'admin';
  // No dedicated finance/ops role in the hierarchy: finance is gated by the
  // can_manage_finance capability; "ops" maps to any operator (editor/collaborator).
  const isFinance = isAdmin || !!canManageFinance;
  const isOps = isAdmin || ['editor', 'collaborator'].includes(profile?.role);
  const isViewer = profile?.role === 'viewer';

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