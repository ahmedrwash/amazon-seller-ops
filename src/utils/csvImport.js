import { createEmptyProduct } from '@/types/product';
import { AMAZON_CATEGORIES } from '@/constants/amazonCategories';

export const importFromCSV = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV file is empty or invalid');
        }

        // Skip header row
        const dataLines = lines.slice(1);
        const products = [];
        
        dataLines.forEach((line, index) => {
          // Simple CSV parsing (handles quoted fields)
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          
          // Allow loose matching but require core fields
          if (!matches || matches.length < 12) {
             console.warn(`Skipping invalid line ${index + 2}: Insufficient columns`);
             return; 
          }

          const values = matches.map(val => val.replace(/^"|"$/g, '').trim());

          const mainCategory = values[1] || '';
          const subCategory = values[2] || '';

          // Validate Category
          if (mainCategory && !AMAZON_CATEGORIES[mainCategory]) {
             throw new Error(`Line ${index + 2}: Invalid Main Category "${mainCategory}"`);
          }
          if (mainCategory && subCategory && AMAZON_CATEGORIES[mainCategory] && !AMAZON_CATEGORIES[mainCategory].includes(subCategory)) {
             throw new Error(`Line ${index + 2}: Invalid Subcategory "${subCategory}" for "${mainCategory}"`);
          }

          const product = createEmptyProduct();
          product.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
          product.name = values[0] || '';
          product.mainCategory = mainCategory;
          product.subCategory = subCategory;
          product.category = subCategory ? `${mainCategory} > ${subCategory}` : mainCategory;
          
          product.sellingPrice = parseFloat(values[3]) || 0;
          product.costPrice = parseFloat(values[4]) || 0;
          product.monthlyUnits = parseInt(values[5]) || 0;
          product.demandLevel = values[6] || 'Medium';
          product.competitionLevel = values[7] || 'Medium';
          product.easeOfSourcing = parseInt(values[8]) || 5;
          product.brandPotential = parseInt(values[9]) || 5;
          product.reviewsQuality = parseInt(values[10]) || 5;
          product.seasonality = parseInt(values[11]) || 5;
          product.regulatoryRisk = parseInt(values[12]) || 5;

          products.push(product);
        });

        if (products.length === 0) {
            throw new Error('No valid products found in CSV');
        }

        resolve(products);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
};