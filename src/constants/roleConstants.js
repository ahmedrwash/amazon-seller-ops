// Single role vocabulary for the whole app.
// Source of truth = profiles.role (enforced by Supabase RLS via is_admin()/can_edit()).
// Hierarchy: admin > editor > collaborator > viewer
export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  COLLABORATOR: 'collaborator',
  VIEWER: 'viewer',
};

// Roles allowed to create / edit operational data.
export const OPERATOR_ROLES = [ROLES.ADMIN, ROLES.EDITOR, ROLES.COLLABORATOR];

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.EDITOR]: 'Editor',
  [ROLES.COLLABORATOR]: 'Collaborator',
  [ROLES.VIEWER]: 'Viewer',
};

export const ROLE_DESCRIPTIONS = {
  [ROLES.ADMIN]: 'Full access to all features, including user management.',
  [ROLES.EDITOR]: 'Can create and edit products and operations data.',
  [ROLES.COLLABORATOR]: 'Can edit operational data but cannot create products.',
  [ROLES.VIEWER]: 'Read-only access to products and data.',
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['manage_users', 'manage_products', 'manage_finance', 'manage_content', 'view_all'],
  [ROLES.EDITOR]: ['manage_products', 'manage_tasks', 'manage_inventory', 'manage_suppliers', 'view_finance', 'view_dashboard', 'view_products'],
  [ROLES.COLLABORATOR]: ['manage_tasks', 'manage_inventory', 'view_dashboard', 'view_products'],
  [ROLES.VIEWER]: ['view_dashboard', 'view_products', 'view_inventory'],
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]: '#EF4444',        // Red
  [ROLES.EDITOR]: '#3B82F6',       // Blue
  [ROLES.COLLABORATOR]: '#F59E0B', // Amber
  [ROLES.VIEWER]: '#6B7280',       // Gray
};

// Capability flags (profiles.can_manage_finance / can_manage_users) gate the two
// sensitive cross-cutting areas on top of the role hierarchy.
export const ROUTE_PERMISSIONS = {
  '/user-management': [ROLES.ADMIN],
  '/settings': [ROLES.ADMIN],
  '/finance': [ROLES.ADMIN, ROLES.EDITOR],
  '/growth': [ROLES.ADMIN, ROLES.EDITOR],
  '/pipeline': OPERATOR_ROLES,
  '/tasks': OPERATOR_ROLES,
  '/compliance': OPERATOR_ROLES,
  '/suppliers': OPERATOR_ROLES,
  '/products/new': [ROLES.ADMIN, ROLES.EDITOR],
  '/products/:id/edit': [ROLES.ADMIN, ROLES.EDITOR],
  '/email-intake': OPERATOR_ROLES,
  '/email-intake/settings': [ROLES.ADMIN],
};
