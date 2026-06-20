import { format } from 'date-fns';
import { TABLE_FIELDS } from '@/constants/emailIntakeConstants';

export function matchRules(from, subject, rules = []) {
  if (!rules || rules.length === 0) return null;

  // Sort by priority (high to low)
  const sortedRules = [...rules].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  for (const rule of sortedRules) {
    if (!rule.enabled) continue;

    const conditions = rule.match_conditions || {};
    let matchesSubject = true;
    let matchesFrom = true;

    if (conditions.subject_contains && conditions.subject_contains.length > 0) {
      matchesSubject = conditions.subject_contains.some(term => 
        subject?.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (conditions.from_contains && conditions.from_contains.length > 0) {
      matchesFrom = conditions.from_contains.some(term => 
        from?.toLowerCase().includes(term.toLowerCase())
      );
    }

    if (matchesSubject && matchesFrom) {
      return rule;
    }
  }

  return null;
}

export function suggestFieldMappings(email, rule) {
  if (!rule || !rule.default_target) return {};
  
  // Basic suggestions from rule hints
  const hints = rule.default_target.field_hints || {};
  const suggestions = { ...hints };

  // Simple heuristics if no specific hints
  if (!suggestions.description && email.body_text) {
      suggestions.description = email.body_text.substring(0, 500); // Truncate
  }
  if (!suggestions.title && email.subject) {
      suggestions.title = email.subject;
  }
  if (!suggestions.notes && email.subject) {
      suggestions.notes = `From: ${email.inbound_from} - ${email.subject}`;
  }

  return suggestions;
}

export function validateFieldMappings(fieldMappings, targetTable) {
  const errors = [];
  if (!fieldMappings || Object.keys(fieldMappings).length === 0) {
    errors.push('No fields mapped.');
    return errors;
  }

  // Very basic validation - in real app, check required fields from schema
  const requiredFields = {
    tasks: ['title'],
    products: ['product_name'],
    suppliers: ['name'],
    cost_entries: ['amount', 'period', 'cost_type']
  };

  const required = requiredFields[targetTable] || [];
  required.forEach(field => {
    if (!fieldMappings[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return errors;
}

export function getTableFields(targetTable) {
  return TABLE_FIELDS[targetTable] || [];
}

export function formatEmailDate(date) {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}