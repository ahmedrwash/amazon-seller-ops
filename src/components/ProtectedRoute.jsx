import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useRouteGuard } from '@/hooks/useRouteGuard';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import AccessDeniedModal from '@/components/AccessDeniedModal';

const ProtectedRoute = ({ children, requiredRoles = [], requiredPermission = null }) => {
  const location = useLocation();
  const { canAccess, loading, reason } = useRouteGuard(requiredRoles);
  const { permissions, loading: authLoading } = useAuth();

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-[hsl(var(--terracotta))] animate-spin" />
      </div>
    );
  }

  if (!canAccess) {
    if (reason === 'unauthenticated') {
      return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    if (reason === 'unverified') {
      return <Navigate to="/auth/verify-email" replace />;
    }
    if (reason === 'disabled') {
      return <AccessDeniedModal open={true} />;
    }
    if (reason === 'unauthorized') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  if (requiredPermission && permissions && !permissions[requiredPermission]) {
    return <AccessDeniedModal open={true} />;
  }

  return children;
};

export default ProtectedRoute;