import { DemandLevel, CompetitionLevel, Decision } from '@/types/product';

// Calculate demand score (1-10)
export const calculateDemandScore = (demandLevel, monthlyUnits) => {
  let baseScore = 0;
  
  switch (demandLevel) {
    case DemandLevel.VERY_HIGH:
      baseScore = 10;
      break;
    case DemandLevel.HIGH:
      baseScore = 7;
      break;
    case DemandLevel.MEDIUM:
      baseScore = 5;
      break;
    case DemandLevel.LOW:
      baseScore = 3;
      break;
    default:
      baseScore = 5;
  }
  
  // Adjust based on monthly units
  if (monthlyUnits > 1000) baseScore = Math.min(10, baseScore + 2);
  else if (monthlyUnits > 500) baseScore = Math.min(10, baseScore + 1);
  else if (monthlyUnits < 100) baseScore = Math.max(1, baseScore - 1);
  
  return Math.max(1, Math.min(10, baseScore));
};

// Calculate competition score (1-10, lower competition = higher score)
export const calculateCompetitionScore = (competitionLevel) => {
  switch (competitionLevel) {
    case CompetitionLevel.LOW:
      return 10;
    case CompetitionLevel.MEDIUM:
      return 7;
    case CompetitionLevel.HIGH:
      return 4;
    case CompetitionLevel.VERY_HIGH:
      return 1;
    default:
      return 5;
  }
};

// Calculate profitability score (1-10)
export const calculateProfitabilityScore = (netMarginPct, netProfit) => {
  let score = 0;
  
  // Base score on margin percentage
  if (netMarginPct >= 30) score = 10;
  else if (netMarginPct >= 20) score = 8;
  else if (netMarginPct >= 15) score = 6;
  else if (netMarginPct >= 10) score = 4;
  else if (netMarginPct >= 5) score = 2;
  else score = 1;
  
  // Adjust based on absolute profit
  if (netProfit > 20) score = Math.min(10, score + 2);
  else if (netProfit > 10) score = Math.min(10, score + 1);
  else if (netProfit < 5) score = Math.max(1, score - 1);
  
  return Math.max(1, Math.min(10, score));
};

// Calculate total score (weighted average)
export const calculateTotalScore = (product, netProfit, netMarginPct) => {
  const demandScore = calculateDemandScore(product.demandLevel, product.monthlyUnits);
  const competitionScore = calculateCompetitionScore(product.competitionLevel);
  const profitabilityScore = calculateProfitabilityScore(netMarginPct, netProfit);
  
  // Weighted formula: 30% demand, 25% competition, 25% profitability, 20% other factors
  const otherFactorsScore = (
    product.easeOfSourcing + 
    product.brandPotential + 
    product.reviewsQuality + 
    (11 - product.seasonality) + // Invert seasonality (lower is better)
    (11 - product.regulatoryRisk) // Invert regulatory risk (lower is better)
  ) / 5;
  
  const totalScore = (
    demandScore * 0.3 +
    competitionScore * 0.25 +
    profitabilityScore * 0.25 +
    otherFactorsScore * 0.2
  );
  
  return Math.round(totalScore * 10) / 10; // Round to 1 decimal
};

// Determine decision based on total score
export const calculateDecision = (totalScore, netMarginPct, competitionLevel) => {
  if (totalScore >= 8 && netMarginPct >= 15) {
    return Decision.STRONG_WINNER;
  } else if (totalScore >= 6 && netMarginPct >= 10) {
    return Decision.TEST_PRODUCT;
  } else if (competitionLevel === CompetitionLevel.VERY_HIGH && netMarginPct < 15) {
    return Decision.REJECT;
  } else if (totalScore < 5 || netMarginPct < 5) {
    return Decision.REJECT;
  } else {
    return Decision.TEST_PRODUCT;
  }
};