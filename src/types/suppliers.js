export const createEmptySupplier = () => ({
  name: '',
  country: '',
  contact_name: '',
  email: '',
  phone: '',
  website: '',
  rating: 0,
  notes: '',
  status: 'Active',
  payment_terms: '',
  currency: 'USD'
});

export const createEmptyQuote = (supplierId = '') => ({
  supplier_id: supplierId,
  product_id: '',
  unit_cost: 0,
  moq: 0,
  lead_time_days: 0,
  incoterms: 'FOB',
  currency: 'USD',
  valid_until: null,
  notes: '',
  status: 'Active'
});

export const createEmptySample = (supplierId = '') => ({
  supplier_id: supplierId,
  product_id: '',
  sample_date: new Date().toISOString().split('T')[0],
  status: 'Requested',
  feedback: '',
  quality_rating: 0,
  notes: ''
});

export const createEmptyDocument = (supplierId = '') => ({
  supplier_id: supplierId,
  doc_type: 'Other',
  file_url: '',
  file_name: '',
  notes: ''
});

export const validateSupplier = (supplier) => {
  const errors = {};
  if (!supplier.name?.trim()) errors.name = 'Supplier name is required';
  if (supplier.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.email)) {
    errors.email = 'Invalid email address';
  }
  if (supplier.website && !/^https?:\/\//i.test(supplier.website) && supplier.website.includes('.')) {
      // Very basic check, mainly ensuring protocol if present, or just let it slide if user didn't type http
      // Ideally we prepend http if missing, but for validation let's just warn if it looks totally wrong
  }
  return errors;
};

export const validateQuote = (quote) => {
  const errors = {};
  if (!quote.product_id) errors.product_id = 'Product is required';
  if (!quote.unit_cost || quote.unit_cost <= 0) errors.unit_cost = 'Unit cost must be greater than 0';
  if (!quote.moq || quote.moq <= 0) errors.moq = 'MOQ must be greater than 0';
  if (!quote.lead_time_days || quote.lead_time_days <= 0) errors.lead_time_days = 'Lead time must be greater than 0';
  return errors;
};

export const validateSample = (sample) => {
  const errors = {};
  if (!sample.product_id) errors.product_id = 'Product is required';
  if (!sample.sample_date) errors.sample_date = 'Date is required';
  return errors;
};

export const validateDocument = (doc) => {
  const errors = {};
  if (!doc.doc_type) errors.doc_type = 'Document type is required';
  if (!doc.file_url) errors.file = 'File is required';
  return errors;
};