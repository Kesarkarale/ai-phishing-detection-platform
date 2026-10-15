// ============================================
// EMAIL RISK ENGINE
// ============================================

function calculateEmailRisk(checks) {
  if (!checks || typeof checks !== "object") {
    throw new Error("Valid email checks are required");
  }

  const ruleScores = [
    checks.urgentLanguage?.score,
    checks.scamKeywords?.score,
    checks.credentialRequests?.score,
    checks.fakeSecurityWarnings?.score,
    checks.suspiciousLinks?.score,
  ];

  // Validate and safely combine rule scores.
  const score = Math.min(
    ruleScores.reduce((total, value) => {
      const number = Number(value ?? 0);

      if (!Number.isFinite(number) || number < 0) {
        return total;
      }

      return total + number;
    }, 0),
    100
  );

  // Count independent categories that detected indicators.
  const detectedCategories = [
    checks.urgentLanguage?.detected,
    checks.scamKeywords?.detected,
    checks.credentialRequests?.detected,
    checks.fakeSecurityWarnings?.detected,
    checks.suspiciousLinks?.detected,
  ].filter(Boolean).length;

  let riskLevel;
  let status;
  let recommendation;

  // High risk requires a high score or multiple strong indicators.
  if (
    score >= 60 ||
    (score >= 40 && detectedCategories >= 3)
  ) {
    riskLevel = "HIGH";
    status = "Possible Phishing Attempt Detected";
    recommendation =
      "Do not click links or share sensitive information. Verify through the official website or contact channel.";
  } else if (score >= 25) {
    riskLevel = "MEDIUM";
    status = "Potentially Suspicious Email";
    recommendation =
      "Proceed With Caution. Verify the sender and links before taking action.";
  } else {
    riskLevel = "LOW";
    status = "No Strong Phishing Indicators Detected";
    recommendation =
      "No strong warning signs were detected by these rules. Still verify unexpected requests.";
  }

  return {
    riskScore: score,
    riskLevel,
    status,
    recommendation,
    detectedCategories,
  };
}

module.exports = {
  calculateEmailRisk,
};
