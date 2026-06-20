export const createEmptyListingBrief = (productMarketplaceId = '') => ({
  product_marketplace_id: productMarketplaceId,
  title: '',
  bullets: ['', '', '', '', ''],
  description: '',
  keywords: [],
  status: 'Draft',
  seo_score: 0,
  character_count: { title: 0, bullets: 0, description: 0 }
});

export const createEmptyCreativeAsset = (productMarketplaceId = '') => ({
  product_marketplace_id: productMarketplaceId,
  asset_type: 'Gallery Image',
  file_url: '',
  file_name: '',
  file_size: 0,
  status: 'Pending',
  approval_notes: '',
  display_order: 0
});

export const createEmptyChecklistItem = (productMarketplaceId = '') => ({
  product_marketplace_id: productMarketplaceId,
  item: '',
  category: 'Content',
  status: 'Pending',
  required: true,
  notes: ''
});

export const validateListingBrief = (brief) => {
  const errors = {};
  if (!brief.title) errors.title = 'Title is required';
  if (brief.title.length > 200) errors.title = 'Title must be less than 200 characters';
  
  if (!brief.description) errors.description = 'Description is required';
  if (brief.description.length > 2000) errors.description = 'Description must be less than 2000 characters';
  
  const nonEmptyBullets = brief.bullets.filter(b => b && b.trim().length > 0);
  if (nonEmptyBullets.length < 1) errors.bullets = 'At least one bullet point is required';
  if (brief.bullets.some(b => b.length > 500)) errors.bullets = 'Bullet points must be less than 500 characters';

  return errors;
};

export const validateCreativeAsset = (asset) => {
  const errors = {};
  if (!asset.asset_type) errors.asset_type = 'Asset type is required';
  if (!asset.file_url) errors.file = 'File upload is required';
  return errors;
};