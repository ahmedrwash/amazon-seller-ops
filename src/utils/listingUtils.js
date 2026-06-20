import { LISTING_STATUS_COLORS, ASSET_STATUS_COLORS, ASSET_TYPE_COLORS, ASSET_TYPE_ICONS } from '@/constants/listingConstants';

export const calculateSEOScore = (title = '', bullets = [], description = '', keywords = []) => {
  let score = 0;
  const recommendations = [];

  // Title analysis (0-25)
  if (title.length > 80 && title.length < 200) score += 25;
  else if (title.length > 0) score += 10;
  else recommendations.push("Add a title");

  // Bullets analysis (0-25)
  const nonEmptyBullets = bullets.filter(b => b && b.trim().length > 0);
  if (nonEmptyBullets.length >= 5) score += 25;
  else if (nonEmptyBullets.length >= 3) score += 15;
  else recommendations.push("Use at least 5 bullet points");

  // Description analysis (0-25)
  if (description.length > 1000) score += 25;
  else if (description.length > 200) score += 15;
  else recommendations.push("Expand description to >1000 characters");

  // Keywords analysis (0-25)
  if (keywords.length >= 5) score += 25;
  else if (keywords.length > 0) score += 10;
  else recommendations.push("Add at least 5 keywords");

  return { score: Math.min(100, score), recommendations };
};

export const calculateCompletionPercentage = (checklistItems = []) => {
  if (!checklistItems || checklistItems.length === 0) return 0;
  const requiredItems = checklistItems.filter(i => i.required);
  if (requiredItems.length === 0) return 100; // No required items
  const completedItems = requiredItems.filter(i => i.status === 'Complete');
  return Math.round((completedItems.length / requiredItems.length) * 100);
};

export const getAssetTypeIcon = (assetType) => {
  return ASSET_TYPE_ICONS[assetType];
};

export const getAssetTypeColor = (assetType) => {
  return ASSET_TYPE_COLORS[assetType] || ASSET_TYPE_COLORS['Other'];
};

export const getStatusColor = (status, type = 'listing') => {
  if (type === 'asset') return ASSET_STATUS_COLORS[status] || ASSET_STATUS_COLORS['Pending'];
  return LISTING_STATUS_COLORS[status] || LISTING_STATUS_COLORS['Draft'];
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};