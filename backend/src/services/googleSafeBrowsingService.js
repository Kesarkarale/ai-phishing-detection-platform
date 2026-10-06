// ============================================
// GOOGLE SAFE BROWSING SERVICE
// ============================================

const SAFE_BROWSING_URL =
  "https://safebrowsing.googleapis.com/v4/threatMatches:find";

async function checkUrlWithGoogleSafeBrowsing(url) {
  const apiKey =
    process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  // API key not configured
  if (!apiKey) {
    return {
      available: false,
      checked: false,
      message:
        "Google Safe Browsing API key is not configured.",
    };
  }

  try {
    const response = await fetch(
      `${SAFE_BROWSING_URL}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          client: {
            clientId:
              "ai-phishing-detection-platform",

            clientVersion: "1.0.0",
          },

          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],

            platformTypes: [
              "ANY_PLATFORM",
            ],

            threatEntryTypes: [
              "URL",
            ],

            threatEntries: [
              {
                url,
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      console.error(
        "Google Safe Browsing API Error:",
        response.status,
        errorText
      );

      return {
        available: true,
        checked: false,
        error: true,
        message:
          "Google Safe Browsing request failed.",
      };
    }

    const data =
      await response.json();

    const matches =
      Array.isArray(data.matches)
        ? data.matches
        : [];

    return {
      available: true,
      checked: true,

      safe: matches.length === 0,

      threatDetected:
        matches.length > 0,

      threatCount:
        matches.length,

      threats: matches.map(
        (match) => ({
          threatType:
            match.threatType,

          platformType:
            match.platformType,

          threatEntryType:
            match.threatEntryType,

          url:
            match.threat?.url || url,
        })
      ),

      message:
        matches.length > 0
          ? "Google Safe Browsing detected a threat."
          : "Google Safe Browsing found no matching threat.",
    };
  } catch (error) {
    console.error(
      "Google Safe Browsing Service Error:",
      error
    );

    return {
      available: true,
      checked: false,
      error: true,
      message:
        "Unable to connect to Google Safe Browsing.",
    };
  }
}

module.exports = {
  checkUrlWithGoogleSafeBrowsing,
};