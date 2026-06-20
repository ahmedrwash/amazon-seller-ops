import React from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

/**
 * Page-level guard. Renders children only if the user has `view` access to the
 * module; otherwise shows a friendly "no access" page. Place inside
 * ProtectedRoute (auth is handled there). UX layer — RLS is the real gate.
 */
export default function RequireModule({ module, children }) {
  const { can } = usePermissions();
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[hsl(var(--parchment))]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" />
      </div>
    );
  }

  if (!can(module, 'view')) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-8">
        <ShieldAlert className="h-14 w-14 text-amber-500 mb-4" />
        <h2 className="text-2xl font-bold text-[hsl(var(--cinder))] mb-2">No access to this page</h2>
        <p className="text-slate-500 mb-6 max-w-md">
          You don’t have permission to view this section. If you need access, ask an administrator to grant it.
        </p>
        <Button asChild className="bg-[hsl(var(--terracotta))] hover:opacity-90 text-white">
          <Link to="/ops-hub">Back to Ops Hub</Link>
        </Button>
      </div>
    );
  }

  return children;
}
