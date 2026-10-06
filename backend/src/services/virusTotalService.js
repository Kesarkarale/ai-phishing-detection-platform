// ============================================
// VIRUSTOTAL URL REPUTATION SERVICE
// ============================================

const VIRUSTOTAL_BASE_URL =
  "https://www.virustotal.com/api/v3";

// Convert URL into VirusTotal URL ID
function getVirusTotalUrlId(url) {
  return Buffer.from(url)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// Check URL reputation using VirusTotal
async function checkUrlWithVirusTotal(url) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  // API key not configured
  if (!apiKey) {
    return {
      available: false,
      checked: false,
      message: "VirusTotal API key is not configured.",
    };
  }

  try {
    const urlId = getVirusTotalUrlId(url);

    const response = await fetch(
      `${VIRUSTOTAL_BASE_URL}/urls/${urlId}`,
      {
        method: "GET",
        headers: {
          "x-apikey": apiKey,
          Accept: "application/json",
        },
      }
    );

    // URL not present in VirusTotal database
    if (response.status === 404) {
      return {
        available: true,
        checked: true,
        found: false,
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0,
        message:
          "URL was not found in VirusTotal database.",
      };
    }

    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "VirusTotal API Error:",
        response.status,
        errorText
      );

      return {
        available: true,
        checked: false,
        error: true,
        message:
          "VirusTotal request failed.",
      };
    }

    const data = await response.json();

    const stats =
      data?.data?.attributes?.last_analysis_stats || {};

    return {
      available: true,
      checked: true,
      found: true,

      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,

      message:
        "VirusTotal reputation check completed.",
    };
  } catch (error) {
    console.error(
      "VirusTotal Service Error:",
      error
    );

    return {
      available: true,
      checked: false,
      error: true,
      message:
        "Unable to connect to VirusTotal.",
    };
  }
}

module.exports = {
  checkUrlWithVirusTotal,
};