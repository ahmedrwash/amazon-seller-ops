import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roleConstants';

export default function OpsRoute({ children }) {
  return (
    <ProtectedRoute requiredRoles={[ROLES.ADMIN, ROLES.OPS]}>
      {children}
    </ProtectedRoute>
  );
}