import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { ROLES } from '@/constants/roleConstants';

export default function AdminRoute({ children }) {
  return (
    <ProtectedRoute requiredRoles={[ROLES.ADMIN]}>
      {children}
    </ProtectedRoute>
  );
}