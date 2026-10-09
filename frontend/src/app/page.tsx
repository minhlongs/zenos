'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TelemetrySummary, ApprovalRecord, TelemetryEvent } from '../types/zenos';
import { fetchTelemetry, fetchApprovals } from '../lib/zenos-client';
import { TelemetryCards } from '../components/TelemetryCards';
import { ApprovalQueue } from '../components/ApprovalQueue';
import { EventsLog } from '../components/EventsLog';
import { ShieldCheck, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<TelemetrySummary | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [telemetryData, approvalsData] = await Promise.all([
      fetchTelemetry(),
      fetchApprovals()
    ]);
    if (telemetryData) {
      setSummary(telemetryData.summary);
      setEvents(telemetryData.recentEvents);
    }
    setApprovals(approvalsData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-8 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              ZenOS Operations & Observability
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Local-first AI workstation telemetry, execution metrics, and human approval queue.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-[#1e293b] transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <TelemetryCards summary={summary} />
      <ApprovalQueue approvals={approvals} onRefresh={loadData} />
      <EventsLog events={events} />
    </main>
  );
}
