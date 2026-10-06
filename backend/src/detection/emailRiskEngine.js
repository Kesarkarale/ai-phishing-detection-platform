// ============================================
// EMAIL RISK ENGINE
// ============================================

function calculateEmailRisk(checks) {
  let score = 0;

  score +=
    checks.urgentLanguage?.score || 0;

  score +=
    checks.scamKeywords?.score || 0;

  score +=
    checks.credentialRequests?.score || 0;

  score +=
    checks.fakeSecurityWarnings?.score || 0;

  score +=
    checks.suspiciousLinks?.score || 0;

  score = Math.min(
    Math.max(score, 0),
    100
  );

  let riskLevel;
  let status;
  let recommendation;

  if (score >= 60) {
    riskLevel = "HIGH";
    status = "Possible Phishing Attempt Detected";
    recommendation =
      "Avoid interacting with this email";
  } else if (score >= 30) {
    riskLevel = "MEDIUM";
    status = "Potentially Suspicious Email";
    recommendation =
      "Proceed With Caution";
  } else {
    riskLevel = "LOW";
    status = "Likely Safe Email";
    recommendation =
      "Email Appears Safe";
  }

  return {
    riskScore: score,
    riskLevel,
    status,
    recommendation,
  };
}

module.exports = {
  calculateEmailRisk,
};