export const exportToCSV = (products) => {
  if (products.length === 0) {
    throw new Error('No products to export');
  }

  // Define headers
  const headers = [
    'Name',
    'Main Category',
    'Sub Category',
    'Selling Price',
    'Cost Price',
    'Monthly Units',
    'Demand Level',
    'Competition Level',
    'Ease of Sourcing',
    'Brand Potential',
    'Reviews Quality',
    'Seasonality',
    'Regulatory Risk',
    'Amazon Fees',
    'PPC Cost',
    'Net Profit',
    'Net Margin %',
    'Demand Score',
    'Competition Score',
    'Profitability Score',
    'Total Score',
    'Decision'
  ];

  // Convert products to CSV rows
  const rows = products.map(product => [
    product.name,
    product.mainCategory || product.category, // Fallback for legacy data
    product.subCategory || '',
    product.sellingPrice,
    product.costPrice,
    product.monthlyUnits,
    product.demandLevel,
    product.competitionLevel,
    product.easeOfSourcing,
    product.brandPotential,
    product.reviewsQuality,
    product.seasonality,
    product.regulatoryRisk,
    product.amazonFees.toFixed(2),
    product.ppcCost.toFixed(2),
    product.netProfit.toFixed(2),
    product.netMarginPct.toFixed(2),
    product.demandScore,
    product.competitionScore,
    product.profitabilityScore,
    product.totalScore.toFixed(1),
    product.decision
  ]);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `amazon-products-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};