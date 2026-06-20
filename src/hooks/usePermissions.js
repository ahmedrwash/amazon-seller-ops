import { useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/hooks/useRole';
import { MODULE_BY_ID, roleModuleDefault } from '@/constants/accessModules';

const ADMIN_ALL = { view: true, create: true, edit: true, delete: true, export: true };

/**
 * Effective per-module access = role default overlaid with the user's saved
 * override (user_module_permissions). Admins bypass everything.
 *
 * UX layer only — Supabase RLS is the real enforcement.
 */
export function usePermissions() {
  const { profile, modulePermissions } = useAuth();
  const { role, isAdmin } = useRole();

  const moduleAccess = useCallback((moduleId) => {
    if (isAdmin) return { ...ADMIN_ALL };
    const module = MODULE_BY_ID[moduleId];
    if (!module) return { view: true, create: false, edit: false, delete: false, export: false };

    const def = roleModuleDefault(module, role, profile);
    const ov = modulePermissions?.[moduleId];
    if (!ov) return def;

    // A saved override row fully specifies that module's access.
    return {
      view: ov.can_view ?? def.view,
      create: ov.can_create ?? def.create,
      edit: ov.can_edit ?? def.edit,
      delete: ov.can_delete ?? def.delete,
      export: ov.can_export ?? def.export,
    };
  }, [role, isAdmin, profile, modulePermissions]);

  const can = useCallback((moduleId, action = 'view') => !!moduleAccess(moduleId)[action], [moduleAccess]);

  return { can, moduleAccess, isAdmin };
}
