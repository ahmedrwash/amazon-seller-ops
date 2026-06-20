import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roleConstants';

export default function FinanceRoute({ children }) {
  return (
    <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.FINANCE]}>
      {children}
    </ProtectedRoute>
  );
}