
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "VirusTotal API key is not configured." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const analysisId = body?.analysisId;

    if (
      typeof analysisId !== "string" ||
      !/^[A-Za-z0-9_-]{1,200}$/.test(analysisId)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid analysis ID." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://www.virustotal.com/api/v3/analyses/${encodeURIComponent(analysisId)}`,
      {
        headers: { "x-apikey": apiKey },
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `VirusTotal report request failed (${response.status}).`,
        },
        { status: response.status === 429 ? 429 : 502 }
      );
    }

    const data = await response.json();
    const attributes = data.data?.attributes;
    const stats = attributes?.stats;

    if (!attributes || !stats) {
      return NextResponse.json(
        { success: false, error: "Analysis report is not available yet." },
        { status: 202 }
      );
    }

    return NextResponse.json({
      success: true,
      analysisId,
      status: attributes.status,
      stats: {
        malicious: stats.malicious ?? 0,
        suspicious: stats.suspicious ?? 0,
        harmless: stats.harmless ?? 0,
        undetected: stats.undetected ?? 0,
        timeout: stats.timeout ?? 0,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Unable to retrieve the VirusTotal report." },
      { status: 500 }
    );
  }
}