"use client";

import { useEffect, useState } from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://ai-phishing-detection-platform-eqib.onrender.com";

type Scan = {
  id: number;
  scan_type: string;
  risk_score: number;
  risk_level: string;
  created_at: string;
  user_id: string | null;
};

type DashboardData = {
  totalScans: number;
  urlScans: number;
  emailScans: number;
  risk: {
    high: number;
    medium: number;
    low: number;
  };
  recentScans: Scan[];
};

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch(`${API_URL}/api/dashboard/stats`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Unable to load dashboard.");
        }

        setData(result.data);
      } catch {
        setError("Dashboard data load hot nahiye. Backend connection check kara.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const cards = data
    ? [
        { title: "Total Scans", value: data.totalScans, color: "text-blue-700", bg: "bg-blue-50" },
        { title: "URL Scans", value: data.urlScans, color: "text-violet-700", bg: "bg-violet-50" },
        { title: "Email Scans", value: data.emailScans, color: "text-cyan-700", bg: "bg-cyan-50" },
        { title: "High Risk", value: data.risk.high, color: "text-red-700", bg: "bg-red-50" },
        { title: "Medium Risk", value: data.risk.medium, color: "text-amber-700", bg: "bg-amber-50" },
        { title: "Low Risk", value: data.risk.low, color: "text-green-700", bg: "bg-green-50" },
      ]
    : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              AI Phishing Detection
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Dashboard</h1>
            <p className="mt-2 text-slate-500">
              Monitor URL scans, email scans and security risks.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/scanner/url"
              className="rounded-lg bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Scan URL
            </a>
            <a
              href="/analyzer/email"
              className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-100"
            >
              Analyze Email
            </a>
          </div>
        </header>

        {loading && (
          <div className="rounded-xl border bg-white p-8 text-center text-slate-500">
            Loading dashboard statistics...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Unable to load dashboard</p>
            <p className="mt-1 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-white hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && data && (
          <>
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-sm font-medium text-slate-500">{card.title}</p>
                  <p className={`mt-3 text-4xl font-bold ${card.color}`}>
                    {card.value}
                  </p>
                  <div className={`mt-4 h-1.5 w-14 rounded-full ${card.bg}`} />
                </div>
              ))}
            </section>

            <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold">Recent Scans</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest five scan records from the backend
                  </p>
                </div>
                <a
                  href="/history"
                  className="text-sm font-semibold text-blue-700 hover:underline"
                >
                  View History →
                </a>
              </div>

              {data.recentScans.length === 0 ? (
                <p className="p-8 text-center text-slate-500">No scans found yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[650px] text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-5 py-4 font-semibold">Scan ID</th>
                        <th className="px-5 py-4 font-semibold">Type</th>
                        <th className="px-5 py-4 font-semibold">Risk Score</th>
                        <th className="px-5 py-4 font-semibold">Risk Level</th>
                        <th className="px-5 py-4 font-semibold">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentScans.map((scan) => (
                        <tr key={scan.id} className="border-t border-slate-100">
                          <td className="px-5 py-4 font-medium">#{scan.id}</td>
                          <td className="px-5 py-4 capitalize">
                            {scan.scan_type === "url" ? "URL Scan" : "Email Scan"}
                          </td>
                          <td className="px-5 py-4">{scan.risk_score}/100</td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                                scan.risk_level === "HIGH"
                                  ? "bg-red-100 text-red-700"
                                  : scan.risk_level === "MEDIUM"
                                    ? "bg-amber-100 text-amber-800"
                                    : "bg-green-100 text-green-700"
                              }`}
                            >
                              {scan.risk_level}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                            {new Date(scan.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        <footer className="mt-8 text-center text-xs text-slate-400">
          AI Phishing Detection Platform
        </footer>
      </div>
    </main>
  );
}