
"use client";

import { FormEvent, useState } from "react";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Globe2,
  History,
  KeyRound,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Radar,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Target,
  Wifi,
  X,
  Zap,
} from "lucide-react";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

type RuleCheck = {
  detected?: boolean;
  passed?: boolean;
  score?: number;
  message?: string;
  details?: string;
};

type ExternalCheck = {
  available?: boolean;
  checked?: boolean;
  safe?: boolean;
  threatDetected?: boolean;
  threatCount?: number;
  malicious?: number;
  suspicious?: number;
  harmless?: number;
  undetected?: number;
  status?: string;
  message?: string;
  stats?: {
    malicious?: number;
    suspicious?: number;
    harmless?: number;
    undetected?: number;
  };
};

type ScanResult = {
  url: string;
  riskScore: number;
  riskLevel: RiskLevel;
  status?: string;
  recommendation?: string;
  scannedAt?: string;
  checks?: {
    https?: RuleCheck;
    keywords?: RuleCheck;
    suspiciousKeywords?: RuleCheck;
    urlStructure?: RuleCheck;
    domain?: RuleCheck;
    virusTotal?: ExternalCheck;
    googleSafeBrowsing?: ExternalCheck;
  };
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  historySaved?: boolean;
  data?: ScanResult;
  result?: ScanResult;
} & Partial<ScanResult>;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function riskConfig(level?: RiskLevel) {
  if (level === "HIGH") {
    return {
      label: "HIGH RISK",
      color: "#fb7185",
      text: "text-rose-300",
      badge: "border-rose-400/20 bg-rose-400/10 text-rose-300",
      message: "Potentially dangerous patterns detected",
    };
  }

  if (level === "MEDIUM") {
    return {
      label: "MEDIUM RISK",
      color: "#fbbf24",
      text: "text-amber-300",
      badge: "border-amber-400/20 bg-amber-400/10 text-amber-300",
      message: "Some suspicious indicators were found",
    };
  }

  return {
    label: "LOW RISK",
    color: "#34d399",
    text: "text-emerald-300",
    badge: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    message: "No major indicators detected by these checks",
  };
}

function normalizeResult(payload: ApiResponse): ScanResult | null {
  const candidate = payload.data ?? payload.result ?? payload;

  if (
    typeof candidate.riskScore !== "number" ||
    !candidate.url ||
    !candidate.riskLevel
  ) {
    return null;
  }

  return candidate as ScanResult;
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-lg font-bold tracking-tight text-white sm:text-xl">
        {title}
      </h2>
      <p className="mt-1 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function StatusPill({ detected }: { detected?: boolean }) {
  if (detected === undefined) {
    return (
      <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[10px] font-semibold text-slate-400">
        NOT REPORTED
      </span>
    );
  }

  if (detected) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-[10px] font-bold text-rose-300">
        <AlertTriangle size={12} />
        FLAGGED
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
      <CheckCircle2 size={12} />
      PASSED
    </span>
  );
}

function DetectionCard({
  title,
  subtitle,
  icon: Icon,
  check,
}: {
  title: string;
  subtitle: string;
  icon: typeof Shield;
  check?: RuleCheck;
}) {
  const detected =
    check?.detected ??
    (typeof check?.passed === "boolean" ? !check.passed : undefined);

  return (
    <article className="group rounded-2xl border border-slate-800 bg-[#101a2b] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-500/40 hover:bg-[#132036]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/10 bg-cyan-400/10 text-cyan-300">
          <Icon size={19} />
        </div>
        <StatusPill detected={detected} />
      </div>

      <h3 className="mt-4 text-sm font-bold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-400">{subtitle}</p>

      {check?.message && (
        <p className="mt-3 break-words border-t border-slate-800 pt-3 text-xs leading-5 text-slate-400">
          {check.message}
        </p>
      )}
    </article>
  );
}

function ExternalCard({
  title,
  subtitle,
  icon: Icon,
  service,
}: {
  title: string;
  subtitle: string;
  icon: typeof Shield;
  service?: ExternalCheck;
}) {
  const available = service?.available === true;
  const checked = service?.checked === true;

  const malicious = service?.malicious ?? service?.stats?.malicious ?? 0;
  const suspicious = service?.suspicious ?? service?.stats?.suspicious ?? 0;
  const harmless = service?.harmless ?? service?.stats?.harmless ?? 0;
  const undetected = service?.undetected ?? service?.stats?.undetected ?? 0;

  const threatFound =
    service?.threatDetected === true || malicious > 0 || suspicious > 0;

  let label = "Not configured";
  let statusColor = "text-slate-400";
  let StatusIcon = CircleHelp;

  if (available && checked && threatFound) {
    label = "Threat indicators found";
    statusColor = "text-rose-300";
    StatusIcon = ShieldX;
  } else if (available && checked) {
    label = "Scan completed";
    statusColor = "text-emerald-300";
    StatusIcon = ShieldCheck;
  } else if (available) {
    label = "Check incomplete";
    statusColor = "text-amber-300";
    StatusIcon = AlertTriangle;
  }

  return (
    <article className="rounded-2xl border border-slate-800 bg-[#101a2b] p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300">
          <Icon size={21} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-white">{title}</h3>
          <p className="mt-1 text-xs leading-5 text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      <div className={`mt-5 flex items-center gap-2 text-xs font-semibold ${statusColor}`}>
        <StatusIcon size={16} />
        {label}
      </div>

      {checked && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {[
            { label: "Malicious", value: malicious, color: "text-rose-300" },
            { label: "Suspicious", value: suspicious, color: "text-amber-300" },
            { label: "Harmless", value: harmless, color: "text-emerald-300" },
            { label: "Undetected", value: undetected, color: "text-slate-300" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-800 bg-[#0b1322] p-3"
            >
              <p className="text-[11px] text-slate-500">{item.label}</p>
              <p className={`mt-1 text-xl font-extrabold ${item.color}`}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {!available && (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          This API is unavailable or not configured. No safety conclusion can
          be drawn from an unavailable check.
        </p>
      )}

      {available && !checked && (
        <p className="mt-4 text-xs leading-5 text-amber-300/80">
          The service is configured, but a completed result was not returned.
        </p>
      )}

      {service?.message && (
        <p className="mt-3 break-words text-xs leading-5 text-slate-500">
          {service.message}
        </p>
      )}
    </article>
  );
}

export default function URLScannerPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [historySaved, setHistorySaved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleScan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const inputUrl = url.trim();

    if (!inputUrl) {
      setError("Enter a website URL before starting the scan.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setHistorySaved(null);

    try {
      const response = await fetch(`${API_URL}/api/scanner/url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });

      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || payload.success === false) {
        throw new Error(
          payload.message ||
            payload.error ||
            `Request failed with status ${response.status}.`
        );
      }

      const scan = normalizeResult(payload);

      if (!scan) {
        throw new Error("The backend returned an unexpected scan response.");
      }

      setResult(scan);
      setHistorySaved(payload.historySaved ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";

      setError(
        message.toLowerCase().includes("failed to fetch")
          ? "Backend connection failed. Make sure your server is running on port 5000."
          : message
      );
    } finally {
      setLoading(false);
    }
  }

  function resetScanner() {
    setUrl("");
    setResult(null);
    setError("");
    setHistorySaved(null);
  }

  const risk = result
    ? riskConfig(result.riskLevel)
    : null;

  const keywordCheck =
    result?.checks?.suspiciousKeywords ?? result?.checks?.keywords;

  const localChecks = result
    ? [
        {
          title: "HTTPS Encryption",
          subtitle: "Checks whether the URL uses HTTPS.",
          icon: LockKeyhole,
          check: result.checks?.https,
        },
        {
          title: "Suspicious Keywords",
          subtitle: "Looks for potentially deceptive URL terms.",
          icon: Search,
          check: keywordCheck,
        },
        {
          title: "URL Structure",
          subtitle: "Inspects suspicious URL patterns.",
          icon: Link2,
          check: result.checks?.urlStructure,
        },
        {
          title: "Domain Analysis",
          subtitle: "Examines domain-related warning signs.",
          icon: Globe2,
          check: result.checks?.domain,
        },
      ]
    : [];

  return (
    <main className="min-h-screen bg-[#080f1d] text-slate-200">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-cyan-500/[0.07] blur-3xl" />
        <div className="absolute -right-40 top-80 h-96 w-96 rounded-full bg-violet-500/[0.06] blur-3xl" />
      </div>

      <div className="relative">
        <header className="sticky top-0 z-20 border-b border-slate-800/90 bg-[#080f1d]/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-950/40">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-white sm:text-lg">
                  PhishGuard<span className="text-cyan-400">.</span>
                </h1>
                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                  Threat intelligence platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-3 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10px] font-bold text-emerald-300 sm:text-xs">
                SCANNER WORKSPACE
              </span>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1400px] px-4 py-7 sm:px-6 sm:py-10 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span>Security Lab</span>
            <ChevronRight size={13} />
            <span className="text-cyan-300">URL Scanner</span>
          </div>

          <div className="grid gap-8 xl:grid-cols-[1fr_420px] xl:items-center">
            <section>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-3 py-1.5 text-[10px] font-bold tracking-[0.15em] text-cyan-300">
                <Sparkles size={13} />
                INTELLIGENT URL INSPECTION
              </div>

              <h2 className="mt-5 max-w-3xl text-4xl font-black leading-[1.12] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Don't trust the link.
                <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                  Verify it first.
                </span>
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">
                Investigate suspicious URLs with rule-based analysis and
                available threat intelligence from VirusTotal and Google Safe
                Browsing.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {["URL pattern analysis", "Domain checks", "Threat intelligence"].map(
                  (feature) => (
                    <span
                      key={feature}
                      className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-300"
                    >
                      <CheckCircle2
                        size={13}
                        className="mr-1.5 inline text-cyan-400"
                      />
                      {feature}
                    </span>
                  )
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-700/80 bg-gradient-to-br from-[#152238] to-[#0d1728] p-5 shadow-2xl shadow-black/20 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Radar size={25} />
                </div>
                <div>
                  <h3 className="font-bold text-white">URL Security Scanner</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Start a new security assessment
                  </p>
                </div>
              </div>

              <form onSubmit={handleScan} className="mt-6">
                <label
                  htmlFor="scan-url"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400"
                >
                  Target URL
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-slate-700 bg-[#080f1d] px-3 transition focus-within:border-cyan-400/70 focus-within:ring-4 focus-within:ring-cyan-400/[0.08]">
                  <Globe2 size={18} className="shrink-0 text-cyan-400" />
                  <input
                    id="scan-url"
                    type="text"
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    placeholder="https://example.com"
                    autoComplete="url"
                    disabled={loading}
                    className="min-w-0 flex-1 bg-transparent py-4 text-sm text-white outline-none placeholder:text-slate-600"
                  />
                  {url && (
                    <button
                      type="button"
                      onClick={resetScanner}
                      disabled={loading}
                      aria-label="Clear URL"
                      className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-white"
                    >
                      <X size={17} />
                    </button>
                  )}
                </div>

                <p className="mt-2 text-[11px] leading-5 text-slate-500">
                  Include the protocol, for example https://
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-950/40 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <LoaderCircle size={18} className="animate-spin" />
                      Analyzing target...
                    </>
                  ) : (
                    <>
                      <ScanIcon />
                      Analyze URL
                    </>
                  )}
                </button>
              </form>

              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[0.07] p-3.5"
                >
                  <div className="flex items-start gap-2.5 text-rose-300">
                    <AlertOctagon size={17} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold">Scan unsuccessful</p>
                      <p className="mt-1 break-words text-xs leading-5 text-rose-200/80">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loading && (
                <div className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-semibold text-cyan-200">
                      Inspecting URL signals
                    </span>
                    <span className="text-slate-500">Please wait</span>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-500">
                    Running local rules and configured reputation checks.
                  </p>
                </div>
              )}
            </section>
          </div>

          {result && risk && (
            <div className="mt-12 space-y-10">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-400">
                    Analysis report
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                    Security assessment
                  </h2>
                  <p className="mt-2 text-sm text-slate-400">
                    Review each detection signal before deciding what to do next.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={resetScanner}
                  className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:border-cyan-400/50 hover:text-white sm:self-auto"
                >
                  <RefreshCw size={15} />
                  New scan
                </button>
              </div>

              <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                <section className="rounded-3xl border border-slate-800 bg-[#101a2b] p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        OVERALL RISK SCORE
                      </p>
                      <p className="mt-1 text-[11px] text-slate-600">
                        Scale from 0 to 100
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-cyan-300">
                      <Target size={20} />
                    </div>
                  </div>

                  <div className="mt-8 flex flex-col items-center">
                    <div
                      className="relative flex h-48 w-48 items-center justify-center rounded-full"
                      style={{
                        background: `conic-gradient(${risk.color} ${Math.min(
                          100,
                          Math.max(0, result.riskScore)
                        )}%, #243247 0)`,
                      }}
                    >
                      <div className="absolute inset-[8px] rounded-full bg-[#101a2b]" />
                      <div className="relative text-center">
                        <p className="text-6xl font-black tracking-tighter text-white">
                          {result.riskScore}
                        </p>
                        <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-slate-500">
                          RISK POINTS
                        </p>
                      </div>
                    </div>

                    <span
                      className={`mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-extrabold tracking-wider ${risk.badge}`}
                    >
                      {result.riskLevel === "HIGH" ? (
                        <ShieldX size={15} />
                      ) : result.riskLevel === "MEDIUM" ? (
                        <ShieldAlert size={15} />
                      ) : (
                        <ShieldCheck size={15} />
                      )}
                      {risk.label}
                    </span>

                    <p className="mt-3 text-center text-sm text-slate-400">
                      {risk.message}
                    </p>
                  </div>

                  <div className="mt-7 border-t border-slate-800 pt-5">
                    <p className="text-xs font-bold text-slate-300">
                      Recommendation
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {result.recommendation ||
                        "Review all available scan signals before visiting the website."}
                    </p>
                  </div>
                </section>

                <section className="rounded-3xl border border-slate-800 bg-[#101a2b] p-5 sm:p-7">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        TARGET INFORMATION
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-white">
                        Scan overview
                      </h3>
                    </div>
                    <div className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-cyan-300">
                      <Activity size={20} />
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-800 bg-[#0b1322] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Scanned URL
                    </p>
                    <p className="mt-2 break-all text-sm font-semibold leading-6 text-cyan-200">
                      {result.url}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-[#0b1322] p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Activity size={15} />
                        <span className="text-xs">Scan status</span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-white">
                        {result.status || "Completed"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-[#0b1322] p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <History size={15} />
                        <span className="text-xs">Scan history</span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-white">
                        {historySaved === true
                          ? "Saved"
                          : historySaved === false
                          ? "Not saved"
                          : "Not confirmed"}
                      </p>
                    </div>
                  </div>

                  {result.scannedAt && (
                    <div className="mt-4 flex items-start gap-2 text-xs leading-5 text-slate-500">
                      <Clock3 size={14} className="mt-0.5 shrink-0" />
                      <span>
                        Scanned at:{" "}
                        {new Date(result.scannedAt).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="mt-5 rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-4">
                    <p className="flex items-center gap-2 text-xs font-bold text-amber-200">
                      <AlertTriangle size={15} />
                      Important security note
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">
                      A low risk score is not proof that a website is safe.
                      New phishing websites may not yet be listed in reputation
                      databases.
                    </p>
                  </div>
                </section>
              </div>

              <section>
                <SectionTitle
                  eyebrow="Layer 01 · Rule-based inspection"
                  title="Local detection checks"
                  description="Signals calculated by the URL scanner backend."
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {localChecks.map((item) => (
                    <DetectionCard
                      key={item.title}
                      title={item.title}
                      subtitle={item.subtitle}
                      icon={item.icon}
                      check={item.check}
                    />
                  ))}
                </div>
              </section>

              <section>
                <SectionTitle
                  eyebrow="Layer 02 · External intelligence"
                  title="Reputation services"
                  description="External results are displayed separately. Unavailable services are not treated as safe."
                />

                <div className="grid gap-4 lg:grid-cols-2">
                  <ExternalCard
                    title="VirusTotal"
                    subtitle="Aggregates URL reputation signals from multiple security vendors."
                    icon={ShieldCheck}
                    service={result.checks?.virusTotal}
                  />

                  <ExternalCard
                    title="Google Safe Browsing"
                    subtitle="Checks the URL against supported known web-threat lists."
                    icon={Wifi}
                    service={result.checks?.googleSafeBrowsing}
                  />
                </div>
              </section>

              <div className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-[#101a2b] p-4">
                <KeyRound size={17} className="mt-0.5 shrink-0 text-cyan-300" />
                <p className="text-xs leading-6 text-slate-400">
                  PhishGuard provides an automated assessment, not a guarantee
                  of safety. Do not submit passwords, private tokens, or
                  confidential information to unknown websites.
                </p>
              </div>
            </div>
          )}

          {!result && !loading && !error && (
            <section className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  icon: Search,
                  title: "Analyze URL signals",
                  description:
                    "Inspect HTTPS usage, suspicious terms, URL patterns, and domain characteristics.",
                },
                {
                  icon: ShieldCheck,
                  title: "Cross-check reputation",
                  description:
                    "Use configured threat-intelligence APIs as additional detection signals.",
                },
                {
                  icon: Activity,
                  title: "Review risk results",
                  description:
                    "Understand the score, risk category, and individual detection results.",
                },
              ].map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-slate-800 bg-[#101a2b] p-5 transition hover:border-slate-700"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] text-cyan-300">
                    <feature.icon size={20} />
                  </div>
                  <h3 className="mt-4 text-sm font-bold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-xs leading-6 text-slate-400">
                    {feature.description}
                  </p>
                </article>
              ))}
            </section>
          )}

          <footer className="mt-12 border-t border-slate-800 py-6 text-center">
            <p className="text-xs font-semibold text-slate-400">
              PhishGuard <span className="text-cyan-400">·</span> AI Phishing
              Detection Platform
            </p>
            <p className="mt-2 text-[10px] text-slate-600">
              Security research and awareness project
            </p>
          </footer>
        </div>
      </div>
    </main>
  );
}

function ScanIcon() {
  return <Search size={18} />;
}