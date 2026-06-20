import React from 'react';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import { OPERATOR_ROLES } from '@/constants/roleConstants';
import { useRole } from '@/hooks/useRole';
import { useToast } from '@/components/ui/use-toast';

const ReviewerRoute = ({ children }) => {
  const { role } = useRole();
  const { toast } = useToast();

  // Reviewers = any operator (admin/editor/collaborator)
  const isAllowed = OPERATOR_ROLES.includes(role);

  if (!isAllowed && role) {
    // Prevent toast loop by checking if we are already redirecting effectively
    setTimeout(() => {
        toast({
            title: "Access Denied",
            description: "You do not have permission to view this page.",
            variant: "destructive"
        });
    }, 0);
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <ProtectedRoute requiredRoles={OPERATOR_ROLES}>
      {children}
    </ProtectedRoute>
  );
};

export default ReviewerRoute;
