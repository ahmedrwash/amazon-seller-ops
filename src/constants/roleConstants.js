export const ROLES = {
  ADMIN: 'Admin',
  OPS: 'Ops',
  FINANCE: 'Finance',
  VIEWER: 'Viewer'
};

export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: ['manage_users', 'manage_products', 'manage_finance', 'manage_content', 'view_all'],
  [ROLES.OPS]: ['manage_products', 'manage_tasks', 'manage_inventory', 'manage_suppliers', 'view_dashboard'],
  [ROLES.FINANCE]: ['view_finance', 'manage_finance', 'view_dashboard'],
  [ROLES.VIEWER]: ['view_dashboard', 'view_products', 'view_inventory']
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]: '#EF4444', // Red
  [ROLES.OPS]: '#3B82F6',   // Blue
  [ROLES.FINANCE]: '#10B981', // Green
  [ROLES.VIEWER]: '#6B7280'  // Gray
};

export const ROUTE_PERMISSIONS = {
  '/admin/users': [ROLES.ADMIN],
  '/settings': [ROLES.ADMIN],
  '/finance': [ROLES.ADMIN, ROLES.FINANCE],
  '/pipeline': [ROLES.ADMIN, ROLES.OPS],
  '/tasks': [ROLES.ADMIN, ROLES.OPS],
  '/compliance': [ROLES.ADMIN, ROLES.OPS],
  '/suppliers': [ROLES.ADMIN, ROLES.OPS],
  '/products/new': [ROLES.ADMIN, ROLES.OPS],
  '/products/:id/edit': [ROLES.ADMIN, ROLES.OPS],
  '/email-intake': [ROLES.ADMIN, ROLES.OPS, ROLES.FINANCE],
  '/email-intake/settings': [ROLES.ADMIN]
};