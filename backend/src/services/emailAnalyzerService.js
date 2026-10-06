// ============================================
// EMAIL ANALYZER SERVICE
// ============================================

const {
  checkEmailContent,
} = require("../detection/emailRules");

const {
  calculateEmailRisk,
} = require("../detection/emailRiskEngine");

// ============================================
// ANALYZE EMAIL
// ============================================

function analyzeEmail(emailContent) {
  if (
    !emailContent ||
    typeof emailContent !== "string"
  ) {
    throw new Error(
      "Email content is required"
    );
  }

  const cleanedContent =
    emailContent.trim();

  if (!cleanedContent) {
    throw new Error(
      "Email content cannot be empty"
    );
  }

  // ------------------------------------------
  // Detection Rules
  // ------------------------------------------

  const checks =
    checkEmailContent(cleanedContent);

  // ------------------------------------------
  // Risk Calculation
  // ------------------------------------------

  const risk =
    calculateEmailRisk(checks);

  // ------------------------------------------
  // Final Result
  // ------------------------------------------

  return {
    scanType: "email",

    riskScore:
      risk.riskScore,

    riskLevel:
      risk.riskLevel,

    status:
      risk.status,

    recommendation:
      risk.recommendation,

    checks,

    analyzedAt:
      new Date().toISOString(),
  };
}

module.exports = {
  analyzeEmail,
};