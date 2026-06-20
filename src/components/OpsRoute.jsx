import React from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { OPERATOR_ROLES } from '@/constants/roleConstants';

export default function OpsRoute({ children }) {
  // Operators = admin, editor, collaborator
  return (
    <ProtectedRoute requiredRoles={OPERATOR_ROLES}>
      {children}
    </ProtectedRoute>
  );
}
