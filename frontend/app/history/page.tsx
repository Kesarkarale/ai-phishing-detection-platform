"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  ExternalLink,
  Filter,
  Mail,
  RefreshCw,
  ScanSearch,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  X,
  XCircle,
} from "lucide-react";

type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

type ScanHistoryItem = {
  id: string;
  user_id: string | null;
  scan_type: "url" | "email";
  content: string;
  result: Record<string, unknown> | null;
  risk_score: number;
  risk_level: RiskLevel;
  created_at: string;
};

type HistoryResponse = {
  success: boolean;
  message?: string;
  count?: number;
  data?: ScanHistoryItem[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getRiskClasses(level: RiskLevel) {
  if (level === "HIGH") {
    return {
      badge: "border-red-200 bg-red-50 text-red-700",
      icon: "bg-red-100 text-red-600",
      bar: "bg-red-500",
      soft: "bg-red-50",
      border: "border-red-200",
    };
  }

  if (level === "MEDIUM") {
    return {
      badge: "border-amber-200 bg-amber-50 text-amber-700",
      icon: "bg-amber-100 text-amber-600",
      bar: "bg-amber-500",
      soft: "bg-amber-50",
      border: "border-amber-200",
    };
  }

  return {
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "bg-emerald-100 text-emerald-600",
    bar: "bg-emerald-500",
    soft: "bg-emerald-50",
    border: "border-emerald-200",
  };
}

function RiskIcon({
  level,
  size = 18,
}: {
  level: RiskLevel;
  size?: number;
}) {
  if (level === "HIGH") {
    return <ShieldAlert size={size} />;
  }

  if (level === "MEDIUM") {
    return <TriangleAlert size={size} />;
  }

  return <ShieldCheck size={size} />;
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return value;
  }
}

function getContentPreview(item: ScanHistoryItem) {
  if (item.scan_type === "url") {
    return item.content;
  }

  const cleaned = item.content.replace(/\s+/g, " ").trim();

  if (cleaned.length > 130) {
    return `${cleaned.substring(0, 130)}...`;
  }

  return cleaned;
}

function getResultMessage(item: ScanHistoryItem) {
  const result = item.result;

  if (!result) {
    return item.risk_level === "HIGH"
      ? "Potential phishing indicators detected."
      : item.risk_level === "MEDIUM"
        ? "Some suspicious indicators were detected."
        : "No major suspicious indicators detected.";
  }

  const recommendation =
    typeof result.recommendation === "string"
      ? result.recommendation
      : "";

  const status =
    typeof result.status === "string" ? result.status : "";

  return recommendation || status || "Scan completed successfully.";
}

export default function HistoryPage() {
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<"all" | "url" | "email">("all");
  const [riskFilter, setRiskFilter] = useState<
    "all" | "LOW" | "MEDIUM" | "HIGH"
  >("all");

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchHistory(showRefresh = false) {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch(
        `${API_BASE_URL}/api/history?limit=100`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data: HistoryResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to fetch scan history."
        );
      }

      setHistory(data.data || []);
    } catch (err) {
      console.error("History Error:", err);

      if (
        err instanceof TypeError &&
        err.message === "Failed to fetch"
      ) {
        setError(
          "Unable to connect to the backend. Make sure the backend is running on http://localhost:5000."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load scan history."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchHistory();
  }, []);

  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return history.filter((item) => {
      const matchesType =
        filter === "all" || item.scan_type === filter;

      const matchesRisk =
        riskFilter === "all" ||
        item.risk_level === riskFilter;

      const searchableText =
        `${item.content} ${item.scan_type} ${item.risk_level}`.toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesType && matchesRisk && matchesSearch;
    });
  }, [history, filter, riskFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: history.length,
      urls: history.filter((item) => item.scan_type === "url")
        .length,
      emails: history.filter(
        (item) => item.scan_type === "email"
      ).length,
      high: history.filter(
        (item) => item.risk_level === "HIGH"
      ).length,
      medium: history.filter(
        (item) => item.risk_level === "MEDIUM"
      ).length,
      low: history.filter(
        (item) => item.risk_level === "LOW"
      ).length,
    };
  }, [history]);

  function clearFilters() {
    setFilter("all");
    setRiskFilter("all");
    setSearchQuery("");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-100/50 blur-3xl" />
        <div className="absolute -right-40 top-20 h-96 w-96 rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Header */}
        <section className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-bold uppercase tracking-wider text-blue-700">
              <Clock3 size={14} />
              Security Activity
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Scan History
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              View your previous URL and email security scans,
              risk levels and detection results.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchHistory(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={refreshing ? "animate-spin" : ""}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </section>

        {/* Stats */}
        <section className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-6">
          <StatCard
            label="Total Scans"
            value={stats.total}
            icon={<ScanSearch size={19} />}
          />

          <StatCard
            label="URL Scans"
            value={stats.urls}
            icon={<ExternalLink size={19} />}
          />

          <StatCard
            label="Email Scans"
            value={stats.emails}
            icon={<Mail size={19} />}
          />

          <StatCard
            label="High Risk"
            value={stats.high}
            icon={<ShieldAlert size={19} />}
            danger
          />

          <StatCard
            label="Medium"
            value={stats.medium}
            icon={<TriangleAlert size={19} />}
            warning
          />

          <StatCard
            label="Low Risk"
            value={stats.low}
            icon={<ShieldCheck size={19} />}
            safe
          />
        </section>

        {/* Filters */}
        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/40 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            {/* Search */}
            <div className="relative w-full xl:max-w-md">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(event.target.value)
                }
                placeholder="Search URL, email or scan type..."
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* Scan type */}
              <div className="flex items-center gap-2 overflow-x-auto rounded-xl bg-slate-100 p-1">
                <Filter
                  size={16}
                  className="ml-2 shrink-0 text-slate-500"
                />

                {[
                  { value: "all", label: "All" },
                  { value: "url", label: "URLs" },
                  { value: "email", label: "Emails" },
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() =>
                      setFilter(
                        item.value as "all" | "url" | "email"
                      )
                    }
                    className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold transition ${
                      filter === item.value
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Risk */}
              <select
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(
                    event.target.value as
                      | "all"
                      | "LOW"
                      | "MEDIUM"
                      | "HIGH"
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">All Risk Levels</option>
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>

              {(filter !== "all" ||
                riskFilter !== "all" ||
                searchQuery) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  <X size={15} />
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <div>
              <p className="font-bold">Unable to load history</p>
              <p className="mt-1 text-sm leading-6">
                {error}
              </p>

              <button
                type="button"
                onClick={() => fetchHistory()}
                className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 shadow-lg shadow-slate-200/40">
            <div className="flex flex-col items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

              <p className="mt-4 text-sm font-semibold text-slate-700">
                Loading scan history...
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Fetching your security activity
              </p>
            </div>
          </section>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredHistory.length === 0 && (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-lg shadow-slate-200/40">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <ScanSearch size={29} />
              </div>

              <h2 className="mt-5 text-xl font-bold text-slate-900">
                No scans found
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {history.length === 0
                  ? "Your URL and email scans will appear here after you run a security analysis."
                  : "Try changing your search or filter settings."}
              </p>

              {(filter !== "all" ||
                riskFilter !== "all" ||
                searchQuery) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700"
                >
                  Clear Filters
                </button>
              )}
            </section>
          )}

        {/* History list */}
        {!loading &&
          !error &&
          filteredHistory.length > 0 && (
            <section className="mt-8 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Recent Scans
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Showing {filteredHistory.length} of{" "}
                    {history.length} scans
                  </p>
                </div>
              </div>

              {filteredHistory.map((item) => {
                const classes = getRiskClasses(
                  item.risk_level
                );

                const expanded = expandedId === item.id;

                return (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    expanded={expanded}
                    classes={classes}
                    onToggle={() =>
                      setExpandedId(
                        expanded ? null : item.id
                      )
                    }
                  />
                );
              })}
            </section>
          )}

        {/* Footer info */}
        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <Shield size={18} className="mt-0.5 shrink-0" />

          <p className="leading-6">
            Scan history helps you review previous security
            checks. Risk results are based on the detection rules
            and security checks used by the platform at scan time.
          </p>
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  danger,
  warning,
  safe,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  danger?: boolean;
  warning?: boolean;
  safe?: boolean;
}) {
  let iconClass = "bg-blue-50 text-blue-600";

  if (danger) {
    iconClass = "bg-red-50 text-red-600";
  } else if (warning) {
    iconClass = "bg-amber-50 text-amber-600";
  } else if (safe) {
    iconClass = "bg-emerald-50 text-emerald-600";
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${iconClass}`}
        >
          {icon}
        </div>

        <span className="text-2xl font-black text-slate-950">
          {value}
        </span>
      </div>

      <p className="mt-3 text-xs font-semibold text-slate-500">
        {label}
      </p>
    </div>
  );
}

function HistoryCard({
  item,
  expanded,
  classes,
  onToggle,
}: {
  item: ScanHistoryItem;
  expanded: boolean;
  classes: ReturnType<typeof getRiskClasses>;
  onToggle: () => void;
}) {
  const isUrl = item.scan_type === "url";

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/30 transition hover:shadow-xl">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          {/* Scan type */}
          <div className="flex items-start gap-4 lg:w-[240px]">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                isUrl
                  ? "bg-blue-50 text-blue-600"
                  : "bg-indigo-50 text-indigo-600"
              }`}
            >
              {isUrl ? (
                <ExternalLink size={21} />
              ) : (
                <Mail size={21} />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold capitalize text-slate-900">
                  {item.scan_type} Scan
                </span>

                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${classes.badge}`}
                >
                  {item.risk_level}
                </span>
              </div>

              <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                <CalendarDays size={13} />
                {formatDate(item.created_at)}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p
              className={`break-words text-sm font-medium leading-6 ${
                isUrl
                  ? "text-blue-700"
                  : "text-slate-700"
              }`}
            >
              {getContentPreview(item)}
            </p>

            <p className="mt-1.5 text-xs text-slate-400">
              {getResultMessage(item)}
            </p>
          </div>

          {/* Risk */}
          <div className="flex items-center gap-4 lg:w-[170px] lg:justify-end">
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Risk Score
              </p>

              <p
                className={`mt-1 text-2xl font-black ${classes.badge
                  .split(" ")
                  .find((value) => value.startsWith("text-")) || "text-slate-900"}`}
              >
                {item.risk_score}
              </p>
            </div>

            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${classes.icon}`}
            >
              <RiskIcon level={item.risk_level} />
            </div>
          </div>

          {/* Expand */}
          <button
            type="button"
            onClick={onToggle}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label={
              expanded
                ? "Collapse scan details"
                : "Expand scan details"
            }
          >
            {expanded ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </button>
        </div>

        {/* Risk bar */}
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full ${classes.bar}`}
            style={{
              width: `${Math.min(
                Math.max(item.risk_score, 0),
                100
              )}%`,
            }}
          />
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6">
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Scanned Content
              </p>

              <div className="mt-3 max-h-72 overflow-auto rounded-2xl border border-slate-200 bg-white p-4">
                <p className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                  {item.content}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Scan Details
              </p>

              <div className="mt-3 space-y-3">
                <DetailRow
                  label="Type"
                  value={item.scan_type.toUpperCase()}
                />

                <DetailRow
                  label="Risk"
                  value={item.risk_level}
                />

                <DetailRow
                  label="Score"
                  value={`${item.risk_score}/100`}
                />

                <DetailRow
                  label="Date"
                  value={formatDate(item.created_at)}
                />

                <DetailRow
                  label="User ID"
                  value={
                    item.user_id
                      ? `${item.user_id.substring(
                          0,
                          8
                        )}...`
                      : "Not linked"
                  }
                />
              </div>
            </div>
          </div>

          {item.result && (
            <div className="mt-5">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Analysis Result
              </p>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-600">
                  {JSON.stringify(item.result, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-white p-3.5">
      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>

      <span className="max-w-[180px] truncate text-right text-xs font-bold text-slate-800">
        {value}
      </span>
    </div>
  );
}