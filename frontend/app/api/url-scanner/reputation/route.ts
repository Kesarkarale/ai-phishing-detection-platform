
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

async function checkGoogleSafeBrowsing(url: string) {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

  if (!apiKey) {
    return { status: "unavailable", reason: "API key not configured" };
  }

  try {
    const response = await fetch(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: {
            clientId: "ai-phishing-detection-platform",
            clientVersion: "1.0",
          },
          threatInfo: {
            threatTypes: [
              "MALWARE",
              "SOCIAL_ENGINEERING",
              "UNWANTED_SOFTWARE",
              "POTENTIALLY_HARMFUL_APPLICATION",
            ],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }],
          },
        }),
        signal: AbortSignal.timeout(10000),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return { status: "error", reason: `Google API returned ${response.status}` };
    }

    const data = await response.json();

    return data.matches?.length
      ? {
          status: "unsafe",
          threats: data.matches.map((match: { threatType: string }) => match.threatType),
        }
      : { status: "no_match" };
  } catch {
    return { status: "error", reason: "Google API request failed" };
  }
}

async function checkVirusTotal(url: string) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey) {
    return { status: "unavailable", reason: "API key not configured" };
  }

  try {
    const response = await fetch("https://www.virustotal.com/api/v3/urls", {
      method: "POST",
      headers: {
        "x-apikey": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ url }).toString(),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });

    if (!response.ok) {
      return { status: "error", reason: `VirusTotal returned ${response.status}` };
    }

    const data = await response.json();

    return {
      status: "submitted",
      analysisId: data.data?.id ?? null,
      message: "URL submitted; analysis may still be processing.",
    };
  } catch {
    return { status: "error", reason: "VirusTotal request failed" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = body?.url;

    if (typeof input !== "string" || !input.trim() || input.length > 2048) {
      return NextResponse.json(
        { success: false, error: "Enter a valid URL (maximum 2048 characters)." },
        { status: 400 }
      );
    }

    let parsed: URL;

    try {
      const normalized = /^https?:\/\//i.test(input.trim())
        ? input.trim()
        : `https://${input.trim()}`;

      parsed = new URL(normalized);

      if (
        !["http:", "https:"].includes(parsed.protocol) ||
        !parsed.hostname ||
        parsed.username ||
        parsed.password
      ) {
        throw new Error("Invalid URL");
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid HTTP or HTTPS URL." },
        { status: 400 }
      );
    }

    const url = parsed.toString();

    const [google, virusTotal] = await Promise.all([
      checkGoogleSafeBrowsing(url),
      checkVirusTotal(url),
    ]);

    return NextResponse.json({
      success: true,
      url,
      reputation: {
        googleSafeBrowsing: google,
        virusTotal,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to check URL reputation." },
      { status: 500 }
    );
  }
}