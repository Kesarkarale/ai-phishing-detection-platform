// ============================================
// URL DETECTION RULES
// ============================================


// ============================================
// SUSPICIOUS KEYWORDS
// ============================================

function checkSuspiciousKeywords(url) {
  const suspiciousKeywords = [
    "login",
    "signin",
    "verify",
    "verification",
    "account",
    "secure",
    "security",
    "update",
    "confirm",
    "password",
    "credential",
    "bank",
    "banking",
    "payment",
    "wallet",
    "paypal",
    "paytm",
    "free",
    "reward",
    "winner",
    "claim",
    "urgent",
    "suspended",
    "unlock",
    "recover",
    "reset",
  ];

  const lowerUrl = url.toLowerCase();

  const foundKeywords = suspiciousKeywords.filter((keyword) =>
    lowerUrl.includes(keyword)
  );

  return {
    detected: foundKeywords.length > 0,
    score: Math.min(foundKeywords.length * 5, 25),
    keywords: foundKeywords,
  };
}


// ============================================
// HTTPS CHECK
// ============================================

function checkHttps(url) {
  try {
    const parsedUrl = new URL(url);

    const isHttps = parsedUrl.protocol === "https:";

    return {
      secure: isHttps,
      score: isHttps ? 0 : 15,
      message: isHttps
        ? "Website uses HTTPS."
        : "Website does not use HTTPS.",
    };
  } catch (error) {
    return {
      secure: false,
      score: 15,
      message: "Invalid URL.",
    };
  }
}


// ============================================
// URL STRUCTURE CHECK
// ============================================

function checkUrlStructure(url) {
  try {
    const parsedUrl = new URL(url);

    const hostname = parsedUrl.hostname;

    let score = 0;
    const warnings = [];

    // Very long hostname
    if (hostname.length > 40) {
      score += 10;
      warnings.push("Unusually long domain name.");
    }

    // Too many subdomains
    const parts = hostname.split(".");

    if (parts.length > 4) {
      score += 10;
      warnings.push("Too many subdomains.");
    }

    // Excessive hyphens
    const hyphenCount = (hostname.match(/-/g) || []).length;

    if (hyphenCount >= 3) {
      score += 10;
      warnings.push("Multiple hyphens detected in domain.");
    }

    // IP address instead of domain
    const ipPattern =
      /^(?:\d{1,3}\.){3}\d{1,3}$/;

    if (ipPattern.test(hostname)) {
      score += 15;
      warnings.push("URL uses an IP address instead of a domain.");
    }

    return {
      suspicious: score > 0,
      score: Math.min(score, 25),
      warnings,
    };
  } catch (error) {
    return {
      suspicious: true,
      score: 25,
      warnings: ["Invalid URL structure."],
    };
  }
}


// ============================================
// DOMAIN CHECK
// ============================================

function checkDomain(url) {
  try {
    const parsedUrl = new URL(url);

    const hostname = parsedUrl.hostname.toLowerCase();

    const suspiciousTlds = [
      ".tk",
      ".ml",
      ".ga",
      ".cf",
      ".gq",
    ];

    const suspiciousTld = suspiciousTlds.some((tld) =>
      hostname.endsWith(tld)
    );

    const domainParts = hostname.split(".");

    const domainTooShort =
      domainParts.length < 2;

    let score = 0;
    const warnings = [];

    if (suspiciousTld) {
      score += 15;
      warnings.push("Suspicious top-level domain detected.");
    }

    if (domainTooShort) {
      score += 10;
      warnings.push("Unusual domain structure.");
    }

    return {
      suspicious: score > 0,
      score: Math.min(score, 20),
      warnings,
      domain: hostname,
    };
  } catch (error) {
    return {
      suspicious: true,
      score: 20,
      warnings: ["Unable to analyze domain."],
      domain: null,
    };
  }
}


// ============================================
// EXPORTS
// ============================================

module.exports = {
  checkSuspiciousKeywords,
  checkHttps,
  checkUrlStructure,
  checkDomain,
};