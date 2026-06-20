/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} created_by
 * @property {string} title
 * @property {string} [description]
 * @property {string} status - One of TASK_STATUSES
 * @property {string} priority - One of TASK_PRIORITIES
 * @property {string} [due_date]
 * @property {string} [owner]
 * @property {string} [marketplace_id]
 * @property {string} [entity_type] - One of TASK_ENTITY_TYPES
 * @property {string} [entity_id]
 * @property {string} [notes]
 */

export const createEmptyTask = () => ({
  title: '',
  description: '',
  status: 'Open',
  priority: 'Medium',
  due_date: null,
  owner: null,
  marketplace_id: null,
  entity_type: 'General',
  entity_id: null,
  notes: ''
});

export const validateTask = (task) => {
  const errors = {};
  if (!task.title?.trim()) {
    errors.title = 'Title is required';
  }
  if ((task.entity_type === 'Product' || task.entity_type === 'Provider') && !task.entity_id) {
    errors.entity_id = `ID is required for ${task.entity_type}`;
  }
  return errors;
};