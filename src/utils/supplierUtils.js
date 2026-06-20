import { isBefore, startOfDay } from 'date-fns';
import { STATUS_COLORS, DOCUMENT_TYPE_COLORS } from '@/constants/supplierConstants';

export const formatCurrency = (value, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(value);
};

export const calculateTotalCost = (unitCost, quantity) => {
  return (parseFloat(unitCost) || 0) * (parseInt(quantity) || 0);
};

export const isQuoteExpired = (validUntilDate) => {
  if (!validUntilDate) return false;
  return isBefore(new Date(validUntilDate), startOfDay(new Date()));
};

export const getBestPrice = (quotes = []) => {
  if (!quotes || quotes.length === 0) return null;
  // Filter out invalid or zero cost quotes
  const validQuotes = quotes.filter(q => q.unit_cost > 0);
  if (validQuotes.length === 0) return null;
  
  return validQuotes.reduce((min, q) => q.unit_cost < min.unit_cost ? q : min, validQuotes[0]);
};

export const getCountryFlag = (countryCode) => {
  // This is a placeholder. In a real app, you might use a library or image service.
  // We can just return the code or name if no flag service is available.
  // Or simple mapping for common ones if needed.
  return countryCode; 
};

export const getStatusColor = (status) => {
  return STATUS_COLORS[status] || STATUS_COLORS['N/A'];
};

export const getDocumentTypeColor = (docType) => {
  return DOCUMENT_TYPE_COLORS[docType] || DOCUMENT_TYPE_COLORS['Other'];
};