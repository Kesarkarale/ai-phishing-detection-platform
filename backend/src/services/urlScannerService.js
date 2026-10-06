const {
  checkSuspiciousKeywords,
  checkHttps,
  checkUrlStructure,
  checkDomain,
} = require("../detection/urlRules");

const { calculateRisk } = require("../detection/riskEngine");

const {
  checkUrlWithVirusTotal,
} = require("./virusTotalService");

const {
  checkUrlWithGoogleSafeBrowsing,
} = require("./googleSafeBrowsingService");

// ============================================
// URL SCANNER SERVICE
// ============================================

async function scanUrl(url) {
  if (!url || typeof url !== "string") {
    throw new Error("URL is required");
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch (error) {
    throw new Error("Invalid URL format");
  }

  const normalizedUrl = parsedUrl.href;

  // ==========================================
  // LOCAL SECURITY CHECKS
  // ==========================================

  const httpsResult =
    checkHttps(normalizedUrl);

  const keywordResult =
    checkSuspiciousKeywords(normalizedUrl);

  const structureResult =
    checkUrlStructure(normalizedUrl);

  const domainResult =
    checkDomain(normalizedUrl);

  // ==========================================
  // VIRUSTOTAL CHECK
  // ==========================================

  const virusTotalResult =
    await checkUrlWithVirusTotal(
      normalizedUrl
    );

const googleSafeBrowsingResult =
  await checkUrlWithGoogleSafeBrowsing(
    normalizedUrl
  );

  // ==========================================
  // LOCAL RISK CALCULATION
  // ==========================================

  const checks = {
    https: httpsResult,
    keywords: keywordResult,
    urlStructure: structureResult,
    domain: domainResult,
  };

  const risk = calculateRisk(checks);

  // ==========================================
  // VIRUSTOTAL ADDITIONAL RISK
  // ==========================================

  let finalRiskScore = risk.riskScore;

  if (virusTotalResult.checked) {
    if (virusTotalResult.malicious > 0) {
      finalRiskScore += 30;
    }

    if (virusTotalResult.suspicious > 0) {
      finalRiskScore += 15;
    }
  }

if (
  googleSafeBrowsingResult.checked &&
  googleSafeBrowsingResult.threatDetected
) {
  finalRiskScore += 30;
}


  finalRiskScore = Math.min(
    Math.max(finalRiskScore, 0),
    100
  );

  // ==========================================
  // FINAL RISK LEVEL
  // ==========================================

  let finalRiskLevel;
  let finalStatus;
  let finalRecommendation;

  if (finalRiskScore >= 60) {
    finalRiskLevel = "HIGH";
    finalStatus = "Suspicious Website";
    finalRecommendation = "Avoid Visiting";
  } else if (finalRiskScore >= 30) {
    finalRiskLevel = "MEDIUM";
    finalStatus = "Potentially Suspicious";
    finalRecommendation =
      "Proceed With Caution";
  } else {
    finalRiskLevel = "LOW";
    finalStatus = "Likely Safe";
    finalRecommendation =
      "Website Appears Safe";
  }

  // ==========================================
  // FINAL RESULT
  // ==========================================

  return {
    url: normalizedUrl,

    riskScore: finalRiskScore,
    riskLevel: finalRiskLevel,
    status: finalStatus,
    recommendation: finalRecommendation,

    checks: {
      https: httpsResult,

      suspiciousKeywords:
        keywordResult,

      urlStructure:
        structureResult,

      domain:
        domainResult,
    },

    virusTotal: virusTotalResult,

 googleSafeBrowsing:
    googleSafeBrowsingResult,

    scannedAt:
      new Date().toISOString(),
  };
}

module.exports = {
  scanUrl,
};