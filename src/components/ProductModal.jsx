import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DemandLevel, CompetitionLevel } from '@/types/product';
import { validateProduct, clampSliderValue } from '@/utils/validation';
import { AMAZON_CATEGORIES } from '@/constants/amazonCategories';

const ProductModal = ({ isOpen, onClose, onSave, product }) => {
  const [formData, setFormData] = useState(product || {});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (product) {
      setFormData(product);
    }
  }, [product]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleMainCategoryChange = (e) => {
    const newMainCategory = e.target.value;
    setFormData(prev => ({
      ...prev,
      mainCategory: newMainCategory,
      subCategory: '', // Reset subcategory when main category changes
      category: newMainCategory // Keep legacy field in sync roughly
    }));
    
    // Clear errors
    const newErrors = { ...errors };
    delete newErrors.mainCategory;
    delete newErrors.subCategory;
    setErrors(newErrors);
  };

  const handleSubCategoryChange = (e) => {
    const newSubCategory = e.target.value;
    setFormData(prev => ({
      ...prev,
      subCategory: newSubCategory,
      category: `${prev.mainCategory} > ${newSubCategory}` // Update combined string
    }));

    const newErrors = { ...errors };
    delete newErrors.subCategory;
    setErrors(newErrors);
  };

  const handleSliderChange = (field, value) => {
    handleChange(field, clampSliderValue(parseInt(value) || 5));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validation = validateProduct(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-slate-800 rounded-lg w-full max-w-3xl border border-slate-700 my-8"
        >
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">
              {product?.id ? 'Edit Product' : 'Add New Product'}
            </h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className={`w-full px-3 py-2 bg-slate-700 border ${errors.name ? 'border-red-500' : 'border-slate-600'} rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]`}
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              {/* Main Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Main Category *
                </label>
                <select
                  value={formData.mainCategory || ''}
                  onChange={handleMainCategoryChange}
                  className={`w-full px-3 py-2 bg-slate-700 border ${errors.mainCategory ? 'border-red-500' : 'border-slate-600'} rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]`}
                >
                  <option value="">Select Main Category</option>
                  {Object.keys(AMAZON_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {errors.mainCategory && <p className="text-red-400 text-xs mt-1">{errors.mainCategory}</p>}
              </div>

              {/* Sub Category Dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Subcategory *
                </label>
                <select
                  value={formData.subCategory || ''}
                  onChange={handleSubCategoryChange}
                  disabled={!formData.mainCategory}
                  className={`w-full px-3 py-2 bg-slate-700 border ${errors.subCategory ? 'border-red-500' : 'border-slate-600'} rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))] disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <option value="">
                    {formData.mainCategory ? 'Select Subcategory' : 'Select Main Category First'}
                  </option>
                  {formData.mainCategory && AMAZON_CATEGORIES[formData.mainCategory]?.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
                {errors.subCategory && <p className="text-red-400 text-xs mt-1">{errors.subCategory}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Selling Price ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sellingPrice || ''}
                  onChange={(e) => handleChange('sellingPrice', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 bg-slate-700 border ${errors.sellingPrice ? 'border-red-500' : 'border-slate-600'} rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]`}
                />
                {errors.sellingPrice && <p className="text-red-400 text-xs mt-1">{errors.sellingPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cost Price ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costPrice || ''}
                  onChange={(e) => handleChange('costPrice', parseFloat(e.target.value) || 0)}
                  className={`w-full px-3 py-2 bg-slate-700 border ${errors.costPrice ? 'border-red-500' : 'border-slate-600'} rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]`}
                />
                {errors.costPrice && <p className="text-red-400 text-xs mt-1">{errors.costPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Monthly Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.monthlyUnits || 0}
                  onChange={(e) => handleChange('monthlyUnits', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Demand Level
                </label>
                <select
                  value={formData.demandLevel || DemandLevel.MEDIUM}
                  onChange={(e) => handleChange('demandLevel', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]"
                >
                  {Object.values(DemandLevel).map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Competition Level
                </label>
                <select
                  value={formData.competitionLevel || CompetitionLevel.MEDIUM}
                  onChange={(e) => handleChange('competitionLevel', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-[hsl(var(--terracotta))]"
                >
                  {Object.values(CompetitionLevel).map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Additional Factors (1-10)</h3>
              
              {[
                { key: 'easeOfSourcing', label: 'Ease of Sourcing' },
                { key: 'brandPotential', label: 'Brand Potential' },
                { key: 'reviewsQuality', label: 'Reviews Quality' },
                { key: 'seasonality', label: 'Seasonality (lower is better)' },
                { key: 'regulatoryRisk', label: 'Regulatory Risk (lower is better)' }
              ].map(({ key, label }) => (
                <div key={key}>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium text-slate-300">{label}</label>
                    <span className="text-[hsl(var(--terracotta))] font-semibold">{formData[key] || 5}</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={formData[key] || 5}
                    onChange={(e) => handleSliderChange(key, e.target.value)}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-slate-600 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[hsl(var(--terracotta))] hover:bg-[hsl(var(--terracotta))] text-white"
              >
                {product?.id ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProductModal;