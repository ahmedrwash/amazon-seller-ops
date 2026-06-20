// Per-user, per-module access registry.
// Roles set the defaults; admins can override a single user's access per module
// via the `user_module_permissions` table (columns: can_view/create/edit/delete/export).
//
// IMPORTANT: this layer is for UX (hiding pages/buttons). The real enforcement is
// Supabase RLS. Never rely on hiding a button for security.

import { ROLES, OPERATOR_ROLES } from './roleConstants';

const { ADMIN, EDITOR, COLLABORATOR, VIEWER } = ROLES;

// Storable/overridable actions — must match the boolean columns on
// user_module_permissions (can_view, can_create, can_edit, can_delete, can_export).
export const ACTION_KEYS = ['view', 'create', 'edit', 'delete', 'export'];

const ALL = [ADMIN, EDITOR, COLLABORATOR, VIEWER];
const EDITORS = [ADMIN, EDITOR];            // create / delete / export — trusted operators
const OPERATORS = OPERATOR_ROLES;            // admin / editor / collaborator — can edit ops data

// Each module: which roles see it by default (view) and which roles get each action.
export const MODULES = [
  { id: 'ops_hub',         label: 'Amazon Ops Hub',   routes: ['/ops-hub'],
    view: ALL,       actions: { create: EDITORS,  edit: OPERATORS, delete: EDITORS, export: OPERATORS } },
  { id: 'products',        label: 'Products',          routes: ['/products'],
    view: ALL,       actions: { create: EDITORS,  edit: OPERATORS, delete: EDITORS } },
  { id: 'pipeline',        label: 'Pipeline',          routes: ['/pipeline'],
    view: OPERATORS, actions: { edit: OPERATORS } },
  { id: 'tasks',           label: 'Tasks',             routes: ['/tasks'],
    view: OPERATORS, actions: { create: OPERATORS, edit: OPERATORS, delete: EDITORS } },
  { id: 'inventory',       label: 'Inventory',         routes: ['/inventory'],
    view: OPERATORS, actions: { edit: OPERATORS } },
  { id: 'compliance',      label: 'Compliance',        routes: ['/compliance'],
    view: OPERATORS, actions: { edit: OPERATORS } },
  { id: 'suppliers',       label: 'Suppliers',         routes: ['/suppliers'],
    view: OPERATORS, actions: { edit: OPERATORS, delete: EDITORS } },
  { id: 'providers',       label: 'Service Providers', routes: ['/providers', '/provider-cycle'],
    view: OPERATORS, actions: { edit: OPERATORS } },
  { id: 'finance',         label: 'Finance',           routes: ['/finance', '/growth'],
    view: EDITORS,   actions: { edit: EDITORS, export: EDITORS } },
  { id: 'email_intake',    label: 'Email Intake',      routes: ['/email-intake'],
    view: OPERATORS, actions: { edit: OPERATORS } },
  { id: 'user_management', label: 'User Management',   routes: ['/user-management'],
    view: [ADMIN],   actions: { edit: [ADMIN] } },
];

export const MODULE_BY_ID = Object.fromEntries(MODULES.map(m => [m.id, m]));

/** Resolve the module that owns a given route path (longest-prefix match). */
export function moduleForRoute(pathname) {
  let best = null;
  for (const m of MODULES) {
    for (const r of m.routes) {
      if (pathname === r || pathname.startsWith(r + '/')) {
        if (!best || r.length > best.matchLen) best = { id: m.id, matchLen: r.length };
      }
    }
  }
  return best?.id || null;
}

/**
 * Default access for a role on a module, before per-user overrides.
 * Honors the can_manage_finance / can_manage_users capability flags for the
 * two sensitive modules.
 */
export function roleModuleDefault(module, role, profile) {
  const out = {};
  out.view = (module.view || []).includes(role);
  if (module.id === 'finance' && profile?.can_manage_finance) out.view = true;
  if (module.id === 'user_management' && (profile?.can_manage_users || role === ADMIN)) out.view = true;

  for (const a of ['create', 'edit', 'delete', 'export']) {
    const roles = module.actions?.[a];
    out[a] = roles ? roles.includes(role) : false;
  }
  return out;
}
