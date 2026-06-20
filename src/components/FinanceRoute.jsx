import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roleConstants';
import { useAuth } from '@/context/AuthContext';

export default function FinanceRoute({ children }) {
  const { canManageFinance } = useAuth();

  // Finance access = admin/editor by role, OR anyone with the explicit
  // can_manage_finance capability (e.g. an accountant who is otherwise a viewer).
  if (canManageFinance) {
    return <ProtectedRoute>{children}</ProtectedRoute>;
  }

  return (
    <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.EDITOR]}>
      {children}
    </ProtectedRoute>
  );
}
