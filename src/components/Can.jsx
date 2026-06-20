import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * Conditionally render children based on per-module access.
 * Usage: <Can module="products" action="delete"><DeleteButton/></Can>
 * `action` defaults to "view". UX only — RLS still enforces on the server.
 */
export function Can({ module, action = 'view', children, fallback = null }) {
  const { can } = usePermissions();
  return can(module, action) ? <>{children}</> : fallback;
}

export default Can;
