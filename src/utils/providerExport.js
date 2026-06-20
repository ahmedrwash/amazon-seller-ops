export const exportProvidersToCSV = (providers) => {
  if (!providers || providers.length === 0) return;

  const headers = [
    'Provider Name',
    'Type',
    'Status',
    'Rating',
    'Contact Email',
    'Marketplaces',
    'Service Areas'
  ];

  const csvRows = [headers.join(',')];

  providers.forEach(provider => {
    const marketplaces = provider.provider_services 
      ? [...new Set(provider.provider_services.flatMap(s => s.marketplaces || []))].join(';') 
      : '';
      
    const serviceAreas = provider.provider_services
      ? [...new Set(provider.provider_services.map(s => s.service_area))].join(';')
      : '';

    const row = [
      `"${provider.provider_name || ''}"`,
      `"${provider.provider_type || ''}"`,
      `"${provider.status || ''}"`,
      `"${provider.internal_rating || ''}"`,
      `"${provider.primary_contact_email || ''}"`,
      `"${marketplaces}"`,
      `"${serviceAreas}"`
    ];
    csvRows.push(row.join(','));
  });

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `providers_export_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};