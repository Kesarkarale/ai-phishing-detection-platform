// ============================================
// EMAIL DETECTION RULES
// ============================================

// --------------------------------------------
// 1. Urgent / Threatening Language
// --------------------------------------------

function checkUrgentLanguage(emailContent) {
  const urgentKeywords = [
    "urgent",
    "immediately",
    "immediate action",
    "act now",
    "action required",
    "verify now",
    "respond now",
    "within 24 hours",
    "within 48 hours",
    "account suspended",
    "account will be suspended",
    "account blocked",
    "account locked",
    "access will be removed",
    "final warning",
    "last warning",
    "security alert",
    "important notice",
  ];

  const lowerContent = emailContent.toLowerCase();

  const foundKeywords = urgentKeywords.filter((keyword) =>
    lowerContent.includes(keyword)
  );

  return {
    detected: foundKeywords.length > 0,
    score: Math.min(foundKeywords.length * 5, 20),
    keywords: foundKeywords,
  };
}

// --------------------------------------------
// 2. Scam-related Keywords
// --------------------------------------------

function checkScamKeywords(emailContent) {
  const scamKeywords = [
    "congratulations",
    "you have won",
    "winner",
    "prize",
    "reward",
    "lottery",
    "claim now",
    "free money",
    "cash prize",
    "limited offer",
    "refund",
    "tax refund",
    "gift card",
    "bonus",
    "exclusive offer",
    "inheritance",
    "beneficiary",
    "million dollars",
    "easy money",
  ];

  const lowerContent = emailContent.toLowerCase();

  const foundKeywords = scamKeywords.filter((keyword) =>
    lowerContent.includes(keyword)
  );

  return {
    detected: foundKeywords.length > 0,
    score: Math.min(foundKeywords.length * 5, 20),
    keywords: foundKeywords,
  };
}

// --------------------------------------------
// 3. Credential Requests
// --------------------------------------------

function checkCredentialRequests(emailContent) {
  const credentialKeywords = [
    "password",
    "username",
    "user name",
    "login details",
    "login credentials",
    "credentials",
    "otp",
    "one time password",
    "verification code",
    "security code",
    "pin",
    "cvv",
    "card number",
    "bank account",
    "account number",
    "credit card",
    "debit card",
    "social security number",
    "identity verification",
    "verify your identity",
  ];

  const lowerContent = emailContent.toLowerCase();

  const foundKeywords = credentialKeywords.filter((keyword) =>
    lowerContent.includes(keyword)
  );

  return {
    detected: foundKeywords.length > 0,
    score: Math.min(foundKeywords.length * 7, 25),
    keywords: foundKeywords,
  };
}

// --------------------------------------------
// 4. Fake Security Warnings
// --------------------------------------------

function checkFakeSecurityWarnings(emailContent) {
  const securityWarningKeywords = [
    "your account has been compromised",
    "your account has been hacked",
    "suspicious activity detected",
    "unusual activity detected",
    "unauthorized login",
    "unauthorized access",
    "security breach",
    "security threat detected",
    "virus detected",
    "malware detected",
    "your device is infected",
    "account security alert",
    "verify your account",
    "confirm your identity",
    "security verification required",
  ];

  const lowerContent = emailContent.toLowerCase();

  const foundKeywords =
    securityWarningKeywords.filter((keyword) =>
      lowerContent.includes(keyword)
    );

  return {
    detected: foundKeywords.length > 0,
    score: Math.min(foundKeywords.length * 8, 20),
    keywords: foundKeywords,
  };
}

// --------------------------------------------
// 5. Suspicious Links
// --------------------------------------------

function checkSuspiciousLinks(emailContent) {
  const urlRegex =
    /https?:\/\/[^\s<>"']+/gi;

  const links =
    emailContent.match(urlRegex) || [];

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
    "recover",
    "reset",
    "unlock",
    "free",
    "reward",
    "claim",
  ];

  const suspiciousLinks = [];

  for (const link of links) {
    const lowerLink = link.toLowerCase();

    const hasSuspiciousKeyword =
      suspiciousKeywords.some((keyword) =>
        lowerLink.includes(keyword)
      );

    let usesHttps = false;

    try {
      const parsedUrl = new URL(link);
      usesHttps =
        parsedUrl.protocol === "https:";
    } catch (error) {
      // Invalid URL
    }

    if (hasSuspiciousKeyword || !usesHttps) {
      suspiciousLinks.push({
        url: link,
        reasons: [
          ...(hasSuspiciousKeyword
            ? ["Suspicious keyword in URL"]
            : []),
          ...(!usesHttps
            ? ["URL does not use HTTPS"]
            : []),
        ],
      });
    }
  }

  return {
    detected: suspiciousLinks.length > 0,
    score: Math.min(
      suspiciousLinks.length * 10,
      20
    ),
    links,
    suspiciousLinks,
  };
}

// --------------------------------------------
// Combined Email Content Check
// --------------------------------------------

function checkEmailContent(emailContent) {
  if (
    !emailContent ||
    typeof emailContent !== "string"
  ) {
    throw new Error(
      "Email content is required"
    );
  }

  const urgent =
    checkUrgentLanguage(emailContent);

  const scam =
    checkScamKeywords(emailContent);

  const credentials =
    checkCredentialRequests(emailContent);

  const securityWarnings =
    checkFakeSecurityWarnings(emailContent);

  const links =
    checkSuspiciousLinks(emailContent);

  return {
    urgentLanguage: urgent,
    scamKeywords: scam,
    credentialRequests: credentials,
    fakeSecurityWarnings: securityWarnings,
    suspiciousLinks: links,
  };
}

module.exports = {
  checkUrgentLanguage,
  checkScamKeywords,
  checkCredentialRequests,
  checkFakeSecurityWarnings,
  checkSuspiciousLinks,
  checkEmailContent,
};