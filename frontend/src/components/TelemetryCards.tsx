'use strict';
import React from 'react';
import { TelemetrySummary } from '../types/zenos';
import { Activity, Server, Clock, AlertTriangle } from 'lucide-react';

interface TelemetryCardsProps {
  summary: TelemetrySummary | null;
}

export function TelemetryCards({ summary }: TelemetryCardsProps) {
  const total = summary?.totalRequests ?? 0;
  const active = summary?.activeRequests ?? 0;
  const p50 = summary?.latency.p50 ?? 0;
  const p95 = summary?.latency.p95 ?? 0;
  const errorRate = summary?.errorRate ? (summary.errorRate * 100).toFixed(1) : '0.0';

  const cards = [
    { title: 'Total Requests', value: total.toLocaleString(), icon: Server, color: 'text-sky-400' },
    { title: 'Active In-Flight', value: active.toString(), icon: Activity, color: 'text-emerald-400' },
    { title: 'Latency (p50 / p95)', value: `${p50}ms / ${p95}ms`, icon: Clock, color: 'text-indigo-400' },
    { title: 'Error Rate', value: `${errorRate}%`, icon: AlertTriangle, color: Number(errorRate) > 5 ? 'text-rose-400' : 'text-amber-400' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.title} className="bg-[#131a2a] border border-[#1e293b] rounded-lg p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{c.title}</span>
              <Icon className={`w-5 h-5 ${c.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-100">{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}
