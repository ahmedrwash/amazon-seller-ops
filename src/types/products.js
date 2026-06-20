/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} created_by
 * @property {string} product_name
 * @property {string} [brand]
 * @property {string} [main_category]
 * @property {string} [sub_category]
 * @property {string} [notes]
 * @property {string} status
 */

/**
 * @typedef {Object} ProductMarketplace
 * @property {string} id
 * @property {string} product_id
 * @property {string} marketplace_id
 * @property {string} [stage]
 * @property {string} [owner]
 * @property {string} [priority]
 * @property {string} [blockers]
 * @property {string} [go_live_date]
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} ProductDocument
 * @property {string} id
 * @property {string} product_id
 * @property {string} [doc_type]
 * @property {string} [file_url]
 * @property {string} [file_name]
 * @property {string} uploaded_at
 * @property {string} [notes]
 */

/**
 * @typedef {Object} ProductTask
 * @property {string} id
 * @property {string} product_id
 * @property {string} [product_marketplace_id]
 * @property {string} title
 * @property {string} [description]
 * @property {string} [assigned_to]
 * @property {string} [status]
 * @property {string} [due_date]
 * @property {string} [priority]
 * @property {string} created_at
 * @property {string} updated_at
 */

export {};