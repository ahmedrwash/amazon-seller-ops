import { AMAZON_CATEGORIES } from '@/constants/amazonCategories';

// Validate product fields
export const validateProduct = (product) => {
  const errors = {};
  
  if (!product.name || product.name.trim() === '') {
    errors.name = 'Product name is required';
  }
  
  // Validate main category
  if (!product.mainCategory || product.mainCategory.trim() === '') {
    errors.mainCategory = 'Main Category is required';
  } else if (!AMAZON_CATEGORIES[product.mainCategory]) {
    errors.mainCategory = 'Invalid Main Category selected';
  }

  // Validate sub category
  if (!product.subCategory || product.subCategory.trim() === '') {
    errors.subCategory = 'Subcategory is required';
  } else if (product.mainCategory && 
             AMAZON_CATEGORIES[product.mainCategory] && 
             !AMAZON_CATEGORIES[product.mainCategory].includes(product.subCategory)) {
    errors.subCategory = 'Invalid Subcategory for selected Main Category';
  }
  
  if (product.sellingPrice <= 0) {
    errors.sellingPrice = 'Selling price must be greater than 0';
  }
  
  if (product.costPrice < 0) {
    errors.costPrice = 'Cost price cannot be negative';
  }
  
  if (product.monthlyUnits < 0) {
    errors.monthlyUnits = 'Monthly units cannot be negative';
  }
  
  if (product.costPrice >= product.sellingPrice) {
    errors.costPrice = 'Cost price must be less than selling price';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Clamp slider values between 1-10
export const clampSliderValue = (value) => {
  return Math.max(1, Math.min(10, value));
};

// Validate global settings
export const validateSettings = (settings) => {
  const errors = {};
  
  if (settings.referralFeePct < 0 || settings.referralFeePct > 100) {
    errors.referralFeePct = 'Referral fee must be between 0-100%';
  }
  
  if (settings.fbaFulfillmentFee < 0) {
    errors.fbaFulfillmentFee = 'FBA fee cannot be negative';
  }
  
  if (settings.ppcPctOfPrice < 0 || settings.ppcPctOfPrice > 100) {
    errors.ppcPctOfPrice = 'PPC percentage must be between 0-100%';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateCategories = (mainCategory, subCategory) => {
  const errors = {};
  if (!mainCategory) {
    errors.mainCategory = 'Main Category is required';
  } else if (!AMAZON_CATEGORIES[mainCategory]) {
    errors.mainCategory = 'Invalid Main Category';
  }

  if (mainCategory && !subCategory) {
    errors.subCategory = 'Subcategory is required';
  } else if (mainCategory && subCategory && AMAZON_CATEGORIES[mainCategory]) {
    if (!AMAZON_CATEGORIES[mainCategory].includes(subCategory)) {
       errors.subCategory = 'Invalid Subcategory';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};