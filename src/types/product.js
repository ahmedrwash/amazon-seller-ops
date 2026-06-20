// Product type definitions

export const DemandLevel = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  VERY_HIGH: 'Very High'
};

export const CompetitionLevel = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  VERY_HIGH: 'Very High'
};

export const Decision = {
  STRONG_WINNER: 'Strong Winner',
  TEST_PRODUCT: 'Test Product',
  REJECT: 'Reject'
};

// Product interface structure
export const createEmptyProduct = () => ({
  id: Date.now().toString(),
  name: '',
  mainCategory: '',
  subCategory: '',
  category: '', // Kept for legacy compatibility/display string
  sellingPrice: 0,
  costPrice: 0,
  monthlyUnits: 0,
  demandLevel: DemandLevel.MEDIUM,
  competitionLevel: CompetitionLevel.MEDIUM,
  easeOfSourcing: 5,
  brandPotential: 5,
  reviewsQuality: 5,
  seasonality: 5,
  regulatoryRisk: 5
});

// Global settings structure
export const createDefaultSettings = () => ({
  referralFeePct: 15,
  fbaFulfillmentFee: 3.5,
  ppcPctOfPrice: 10
});