// ============================================
// RISK CALCULATION ENGINE
// ============================================

function calculateRisk(checks) {
  let score = 0;

  score += checks.https?.score || 0;
  score += checks.keywords?.score || 0;
  score += checks.urlStructure?.score || 0;
  score += checks.domain?.score || 0;

  // Keep score between 0 and 100
  score = Math.min(Math.max(score, 0), 100);

  let riskLevel;
  let status;
  let recommendation;

  if (score >= 60) {
    riskLevel = "HIGH";
    status = "Suspicious Website";
    recommendation = "Avoid Visiting";
  } else if (score >= 30) {
    riskLevel = "MEDIUM";
    status = "Potentially Suspicious";
    recommendation = "Proceed With Caution";
  } else {
    riskLevel = "LOW";
    status = "Likely Safe";
    recommendation = "Website Appears Safe";
  }

  return {
    riskScore: score,
    riskLevel,
    status,
    recommendation,
  };
}

module.exports = {
  calculateRisk,
};