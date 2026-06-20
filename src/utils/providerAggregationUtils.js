export const getProviderMarketplaces = (services) => {
  if (!services || !Array.isArray(services)) return [];
  const marketplaces = new Set();
  services.forEach(service => {
    if (service.marketplaces && Array.isArray(service.marketplaces)) {
      service.marketplaces.forEach(m => marketplaces.add(m));
    }
  });
  return Array.from(marketplaces);
};

export const getProviderServiceAreas = (services) => {
  if (!services || !Array.isArray(services)) return [];
  return services.map(s => s.service_area).filter(Boolean);
};

export const getLastCommunicationDate = (communications) => {
  if (!communications || !Array.isArray(communications) || communications.length === 0) return null;
  // Sort desc
  const sorted = [...communications].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return sorted[0].created_at;
};

export const getNextFollowUpDate = (communications) => {
  if (!communications || !Array.isArray(communications)) return null;
  // Filter for future dates
  const now = new Date();
  const futureFollowUps = communications
    .filter(c => c.follow_up_date && new Date(c.follow_up_date) > now)
    .sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date));
    
  return futureFollowUps.length > 0 ? futureFollowUps[0].follow_up_date : null;
};