/**
 * @typedef {Object} Marketplace
 * @property {string} id
 * @property {string} code - Unique code (e.g., US, DE)
 * @property {string} name - Display name
 * @property {string} region - Region (e.g., North America, Europe)
 * @property {string} currency - Currency code (e.g., USD, EUR)
 * @property {string} default_language - Language code (e.g., en, de)
 * @property {boolean} vat_required - Whether VAT calculation is required
 * @property {boolean} active - Status of the marketplace
 * @property {string} created_at
 * @property {string} updated_at
 * @property {string} created_by
 */

/**
 * @typedef {Object} MarketplaceFormData
 * @property {string} code
 * @property {string} name
 * @property {string} region
 * @property {string} currency
 * @property {string} default_language
 * @property {boolean} vat_required
 * @property {boolean} active
 */

export {};