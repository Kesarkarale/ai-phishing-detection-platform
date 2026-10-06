"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  FileWarning,
  Fingerprint,
  Link2,
  Mail,
  MessageSquareWarning,
  ScanSearch,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";

type RuleCheck = {
  detected?: boolean;
  score?: number;
  keywords?: string[];
  phrases?: string[];
  links?: string[];
  warnings?: string[];
  messages?: string[];
  count?: number;
  [key: string]: unknown;
};

type EmailChecks = {
  urgentLanguage?: RuleCheck;
  scamKeywords?: RuleCheck;
  credentialRequests?: RuleCheck;
  fakeSecurityWarnings?: RuleCheck;
  suspiciousLinks?: RuleCheck;
  [key: string]: RuleCheck | undefined;
};

type EmailResult = {
  scanType: string;
  riskScore: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  status: string;
  recommendation: string;
  checks: EmailChecks;
  analyzedAt: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  data?: EmailResult;
  historySaved?: boolean;
  historyId?: string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const SAMPLE_EMAIL = `URGENT: Your bank account will be suspended today.

We detected unusual activity on your account. Verify your account immediately to avoid permanent suspension.

Click the link below and confirm your username, password and banking details:

http://secure-bank-login-free.com/verify

Failure to verify your information within 24 hours may result in account closure.`;

const RULE_CONFIG = [
  {
    key: "urgentLanguage",
    title: "Urgent / Threatening Language",
    description:
      "Checks for pressure, deadlines, threats and urgent instructions.",
    icon: Clock3,
  },
  {
    key: "scamKeywords",
    title: "Scam Keywords",
    description:
      "Checks for common phishing and scam-related terminology.",
    icon: MessageSquareWarning,
  },
  {
    key: "credentialRequests",
    title: "Credential Requests",
    description:
      "Detects requests for passwords, OTPs, banking or personal credentials.",
    icon: Fingerprint,
  },
  {
    key: "fakeSecurityWarnings",
    title: "Fake Security Warnings",
    description:
      "Looks for suspicious account/security warning patterns.",
    icon: ShieldAlert,
  },
  {
    key: "suspiciousLinks",
    title: "Suspicious Links",
    description:
      "Checks links for insecure protocols and suspicious URL patterns.",
    icon: Link2,
  },
] as const;

function getRiskStyles(riskLevel: EmailResult["riskLevel"]) {
  if (riskLevel === "HIGH") {
    return {
      card: "border-red-200 bg-red-50",
      icon: "bg-red-100 text-red-600",
      text: "text-red-700",
      badge: "bg-red-100 text-red-700 border-red-200",
      bar: "bg-red-500",
    };
  }

  if (riskLevel === "MEDIUM") {
    return {
      card: "border-amber-200 bg-amber-50",
      icon: "bg-amber-100 text-amber-600",
      text: "text-amber-700",
      badge: "bg-amber-100 text-amber-700 border-amber-200",
      bar: "bg-amber-500",
    };
  }

  return {
    card: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-600",
    text: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-500",
  };
}

function getRuleData(
  checks: EmailChecks | undefined,
  key: string
): RuleCheck {
  if (!checks) {
    return {};
  }

  return checks[key] || {};
}

function getDetected(data: RuleCheck) {
  return data.detected === true;
}

function getDetailItems(data: RuleCheck) {
  const possibleArrays = [
    data.keywords,
    data.phrases,
    data.links,
    data.warnings,
    data.messages,
  ];

  for (const items of possibleArrays) {
    if (Array.isArray(items) && items.length > 0) {
      return items.map(String);
    }
  }

  return [];
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}

function RiskIcon({
  riskLevel,
  size = 24,
}: {
  riskLevel: EmailResult["riskLevel"];
  size?: number;
}) {
  if (riskLevel === "HIGH") {
    return <ShieldAlert size={size} />;
  }

  if (riskLevel === "MEDIUM") {
    return <AlertTriangle size={size} />;
  }

  return <ShieldCheck size={size} />;
}

export default function EmailAnalyzerPage() {
  const [emailContent, setEmailContent] = useState("");
  const [result, setResult] = useState<EmailResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const characterCount = emailContent.length;

  const detectedRules = useMemo(() => {
    if (!result?.checks) {
      return 0;
    }

    return RULE_CONFIG.filter((rule) =>
      getDetected(getRuleData(result.checks, rule.key))
    ).length;
  }, [result]);

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedEmail = emailContent.trim();

    if (!trimmedEmail) {
      setError("Please paste an email message before analyzing.");
      setResult(null);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/analyzer/email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailContent: trimmedEmail,
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to analyze this email."
        );
      }

      if (!data.data) {
        throw new Error("Analyzer returned an empty result.");
      }

      setResult(data.data);
      setExpandedRule(null);
    } catch (err) {
      console.error("Email Analyzer Error:", err);

      if (err instanceof TypeError && err.message === "Failed to fetch") {
        setError(
          "Unable to connect to the backend. Make sure the backend is running on http://localhost:5000."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to analyze the email."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function loadSample() {
    setEmailContent(SAMPLE_EMAIL);
    setResult(null);
    setError("");
  }

  function clearEmail() {
    setEmailContent("");
    setResult(null);
    setError("");
  }

  const riskStyles = result
    ? getRiskStyles(result.riskLevel)
    : getRiskStyles("LOW");

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />
        <div className="absolute -right-32 top-40 h-96 w-96 rounded-full bg-indigo-100/50 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Header */}
        <section className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Mail size={31} />
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            <Sparkles size={15} />
            AI-Assisted Phishing Analysis
          </div>

          <h1 className="mt-5 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            Email Security Analyzer
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Analyze suspicious emails for urgent language, scam keywords,
            credential requests, fake security warnings and suspicious links.
          </p>
        </section>

        {/* Main analyzer */}
        <section className="mx-auto mt-10 max-w-6xl">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            {/* Top bar */}
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-5 sm:px-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <ScanSearch size={22} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-900">
                      Analyze Email Content
                    </h2>
                    <p className="text-xs text-slate-500 sm:text-sm">
                      Paste the complete email message below.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={loadSample}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  <Sparkles size={16} />
                  Try Sample
                </button>
              </div>
            </div>

            <form onSubmit={handleAnalyze} className="p-5 sm:p-7">
              <div className="mb-3 flex items-center justify-between gap-3">
                <label
                  htmlFor="email-content"
                  className="flex items-center gap-2 text-sm font-bold text-slate-800"
                >
                  <FileWarning size={17} className="text-blue-600" />
                  Email Message
                </label>

                <span className="text-xs font-medium text-slate-400">
                  {characterCount.toLocaleString()} characters
                </span>
              </div>

              <div className="relative">
                <textarea
                  id="email-content"
                  value={emailContent}
                  onChange={(event) => {
                    setEmailContent(event.target.value);
                    if (error) {
                      setError("");
                    }
                  }}
                  placeholder={`Paste a suspicious email here...

Example:
Your account will be suspended. Verify your credentials immediately...`}
                  className="min-h-[280px] w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 sm:min-h-[330px] sm:px-5"
                />
              </div>

              {error && (
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 shrink-0" size={19} />
                  <div>
                    <p className="font-bold">Analysis Failed</p>
                    <p className="mt-1 leading-6">{error}</p>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={clearEmail}
                  disabled={loading || !emailContent}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Analyzing Email...
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      Analyze Email
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Results */}
        {result && (
          <section className="mx-auto mt-8 max-w-6xl space-y-6">
            {/* Risk overview */}
            <div
              className={`overflow-hidden rounded-3xl border ${riskStyles.card} shadow-sm`}
            >
              <div className="p-5 sm:p-7">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${riskStyles.icon}`}
                    >
                      <RiskIcon riskLevel={result.riskLevel} size={27} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-extrabold ${riskStyles.badge}`}
                        >
                          {result.riskLevel} RISK
                        </span>

                        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                          {detectedRules} / {RULE_CONFIG.length} rules detected
                        </span>
                      </div>

                      <h2 className="mt-3 text-xl font-bold text-slate-950 sm:text-2xl">
                        {result.status}
                      </h2>

                      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        {result.recommendation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 rounded-2xl border border-white/80 bg-white/70 px-5 py-4">
                    <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-8 border-white shadow-sm">
                      <span
                        className={`text-xl font-black ${riskStyles.text}`}
                      >
                        {result.riskScore}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Risk Score
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        out of 100
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Risk Level</span>
                    <span>{result.riskScore}/100</span>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/80">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${riskStyles.bar}`}
                      style={{
                        width: `${Math.min(
                          Math.max(result.riskScore, 0),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Detection rules */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/40 sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    Detection Engine
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
                    Security Checks
                  </h2>
                </div>

                <p className="text-xs text-slate-500 sm:text-sm">
                  Rule-based phishing indicators
                </p>
              </div>

              <div className="mt-6 grid gap-3">
                {RULE_CONFIG.map((rule) => {
                  const data = getRuleData(result.checks, rule.key);
                  const detected = getDetected(data);
                  const details = getDetailItems(data);
                  const Icon = rule.icon;
                  const expanded = expandedRule === rule.key;

                  return (
                    <div
                      key={rule.key}
                      className={`overflow-hidden rounded-2xl border transition ${
                        detected
                          ? "border-red-200 bg-red-50/50"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedRule(expanded ? null : rule.key)
                        }
                        className="flex w-full items-center gap-3 p-4 text-left sm:p-5"
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            detected
                              ? "bg-red-100 text-red-600"
                              : "bg-emerald-100 text-emerald-600"
                          }`}
                        >
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">
                              {rule.title}
                            </h3>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                detected
                                  ? "bg-red-100 text-red-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {detected ? "DETECTED" : "CLEAR"}
                            </span>
                          </div>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {rule.description}
                          </p>
                        </div>

                        <div className="shrink-0 text-slate-400">
                          {expanded ? (
                            <ChevronUp size={19} />
                          ) : (
                            <ChevronDown size={19} />
                          )}
                        </div>
                      </button>

                      {expanded && (
                        <div className="border-t border-slate-200 bg-white px-5 py-4">
                          {details.length > 0 ? (
                            <div>
                              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                                Detected Indicators
                              </p>

                              <div className="flex flex-wrap gap-2">
                                {details.map((item, index) => (
                                  <span
                                    key={`${item}-${index}`}
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
                                  >
                                    {item}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-500">
                              No detailed indicators were returned for this
                              check.
                            </p>
                          )}

                          {typeof data.score === "number" && (
                            <p className="mt-4 text-xs font-semibold text-slate-500">
                              Rule score:{" "}
                              <span className="text-slate-800">
                                {data.score}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommendation + metadata */}
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/40 sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Shield size={21} />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-600">
                      Security Recommendation
                    </p>
                    <h3 className="mt-1 font-bold text-slate-950">
                      What should you do?
                    </h3>
                  </div>
                </div>

                <div
                  className={`mt-5 rounded-2xl border p-4 ${
                    result.riskLevel === "HIGH"
                      ? "border-red-200 bg-red-50"
                      : result.riskLevel === "MEDIUM"
                        ? "border-amber-200 bg-amber-50"
                        : "border-emerald-200 bg-emerald-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.riskLevel === "HIGH" ? (
                      <XCircle className="mt-0.5 shrink-0 text-red-600" size={20} />
                    ) : result.riskLevel === "MEDIUM" ? (
                      <AlertTriangle
                        className="mt-0.5 shrink-0 text-amber-600"
                        size={20}
                      />
                    ) : (
                      <CheckCircle2
                        className="mt-0.5 shrink-0 text-emerald-600"
                        size={20}
                      />
                    )}

                    <p className="text-sm font-semibold leading-6 text-slate-800">
                      {result.recommendation}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-slate-500">Risk Level</span>
                    <span className="font-bold text-slate-900">
                      {result.riskLevel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-slate-500">Risk Score</span>
                    <span className="font-bold text-slate-900">
                      {result.riskScore}/100
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Analyzed</span>
                    <span className="text-right font-semibold text-slate-700">
                      {formatDate(result.analyzedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/40 sm:p-7">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Mail size={21} />
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                      Scan Summary
                    </p>
                    <h3 className="mt-1 font-bold text-slate-950">
                      Analysis Information
                    </h3>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <UserRound size={17} className="text-slate-500" />
                      <span className="text-sm text-slate-600">
                        Scan Type
                      </span>
                    </div>
                    <span className="text-sm font-bold uppercase text-slate-900">
                      {result.scanType}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <ScanSearch size={17} className="text-slate-500" />
                      <span className="text-sm text-slate-600">
                        Rules Checked
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {RULE_CONFIG.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle size={17} className="text-slate-500" />
                      <span className="text-sm text-slate-600">
                        Indicators Found
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {detectedRules}
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={17} className="text-slate-500" />
                      <span className="text-sm text-slate-600">
                        History Saved
                      </span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {result ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
              <Shield className="mt-0.5 shrink-0" size={18} />
              <p className="leading-6">
                This analyzer uses rule-based security checks to identify
                phishing indicators. A low-risk result does not guarantee
                that an email is completely safe.
              </p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}