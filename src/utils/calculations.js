// Calculate Amazon fees estimate
export const calculateAmazonFees = (sellingPrice, referralFeePct, fbaFulfillmentFee) => {
  const referralFee = (sellingPrice * referralFeePct) / 100;
  return referralFee + fbaFulfillmentFee;
};

// Calculate PPC estimate
export const calculatePPC = (sellingPrice, ppcPctOfPrice) => {
  return (sellingPrice * ppcPctOfPrice) / 100;
};

// Calculate net profit
export const calculateNetProfit = (sellingPrice, costPrice, amazonFees, ppc) => {
  return sellingPrice - costPrice - amazonFees - ppc;
};

// Calculate net margin percentage
export const calculateNetMargin = (netProfit, sellingPrice) => {
  if (sellingPrice === 0) return 0;
  return (netProfit / sellingPrice) * 100;
};