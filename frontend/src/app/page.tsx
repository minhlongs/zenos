'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { TelemetrySummary, ApprovalRecord, TelemetryEvent } from '../types/zenos';
import { fetchTelemetry, fetchApprovals } from '../lib/zenos-client';
import { TelemetryCards } from '../components/TelemetryCards';
import { ApprovalQueue } from '../components/ApprovalQueue';
import { EventsLog } from '../components/EventsLog';
import { ZenStudio } from '../components/ZenStudio';
import { CookConsole } from '../components/CookConsole';
import { GoalPipeline } from '../components/GoalPipeline';
import { SupervisorMonitor } from '../components/SupervisorMonitor';
import { AgentConsole } from '../components/AgentConsole';
import { useFactoryEvents } from '../hooks/useFactoryEvents';
import { RefreshCw, Activity, Cpu } from 'lucide-react';

export default function DashboardPage() {
  const [tab, setTab] = useState<'factory' | 'observability'>('factory');
  const [summary, setSummary] = useState<TelemetrySummary | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRecord[]>([]);
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const { connected: factoryConnected, logs: factoryLogs } = useFactoryEvents();

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
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, [loadData]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#1e293b]">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">
              ZenOS Factory Operations Portal
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              factoryConnected
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-amber-950 text-amber-400 border-amber-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${factoryConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {factoryConnected ? 'Factory SSE Connected' : 'Connecting SSE...'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Apple Silicon Workstation & Autonomous TDD Orchestrator with Metal GPU Concurrency Guard.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <div className="flex bg-[#0f172a] p-1 rounded-lg border border-[#1e293b]">
            <button
              onClick={() => setTab('factory')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                tab === 'factory' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> AI Factory
            </button>
            <button
              onClick={() => setTab('observability')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                tab === 'observability' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Observability
            </button>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-md border border-[#1e293b] transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {tab === 'factory' ? (
        <div className="space-y-6">
          <AgentConsole />
          <SupervisorMonitor />
          <GoalPipeline />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ZenStudio />
            <CookConsole externalLogs={factoryLogs} />
          </div>
          {approvals.length > 0 && <ApprovalQueue approvals={approvals} onRefresh={loadData} />}
        </div>
      ) : (
        <div className="space-y-6">
          <TelemetryCards summary={summary} />
          <ApprovalQueue approvals={approvals} onRefresh={loadData} />
          <EventsLog events={events} />
        </div>
      )}
    </main>
  );
}
