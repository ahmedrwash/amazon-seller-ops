export const EMAIL_STATUS = {
  PENDING: 'Pending',
  IN_REVIEW: 'In Review',
  PROCESSED: 'Processed',
  REJECTED: 'Rejected'
};

export const MAPPING_STATUS = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  APPLIED: 'Applied',
  REJECTED: 'Rejected'
};

export const MAPPING_ACTIONS = {
  INSERT: 'INSERT',
  UPDATE: 'UPDATE'
};

export const TARGET_MODULES = [
  { value: 'tasks', label: 'Tasks' },
  { value: 'suppliers', label: 'Suppliers' },
  { value: 'service_providers', label: 'Service Providers' },
  { value: 'finance', label: 'Finance' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'products', label: 'Products' }
];

export const ALLOWED_TABLES = [
  'tasks',
  'suppliers',
  'service_providers',
  'provider_communications',
  'provider_documents',
  'provider_services',
  'cost_entries',
  'pnl_monthly',
  'inventory',
  'compliance_items',
  'products',
  'product_marketplaces'
];

export const TABLE_FIELDS = {
  tasks: ['title', 'description', 'status', 'priority', 'due_date'],
  suppliers: ['name', 'country', 'contact_name', 'email', 'phone', 'notes'],
  service_providers: ['provider_name', 'provider_type', 'website', 'primary_contact_email'],
  provider_communications: ['subject', 'summary', 'channel', 'follow_up_date'],
  cost_entries: ['cost_type', 'amount', 'period', 'description'],
  inventory: ['on_hand', 'inbound', 'reserved', 'notes'],
  products: ['product_name', 'brand', 'main_category', 'status'],
  compliance_items: ['requirement', 'status', 'due_date', 'notes']
};