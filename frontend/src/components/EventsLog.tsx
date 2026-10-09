'use strict';
import React from 'react';
import { TelemetryEvent } from '../types/zenos';
import { Terminal } from 'lucide-react';

interface EventsLogProps {
  events: TelemetryEvent[];
}

export function EventsLog({ events }: EventsLogProps) {
  return (
    <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg p-5">
      <div className="flex items-center gap-2 mb-4">
        <Terminal className="w-5 h-5 text-sky-400" />
        <h2 className="text-base font-semibold text-slate-100">Live Telemetry Events Stream</h2>
      </div>

      <div className="bg-[#090d16] border border-[#1e293b] rounded p-4 font-mono text-xs max-h-64 overflow-y-auto space-y-1.5">
        {events.length === 0 ? (
          <div className="text-slate-500 italic">No events recorded yet.</div>
        ) : (
          events.map((evt, idx) => (
            <div key={idx} className="flex items-center justify-between py-1 border-b border-slate-900/60 last:border-0">
              <div className="flex items-center gap-3">
                <span className="text-slate-500">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                  evt.type === 'request_end' ? 'bg-sky-950 text-sky-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {evt.type}
                </span>
                <span className="text-slate-300 font-medium">
                  {evt.method ? `${evt.method} ${evt.path}` : evt.model || 'system'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                {evt.statusCode && (
                  <span className={evt.statusCode < 400 ? 'text-emerald-400' : 'text-rose-400'}>
                    HTTP {evt.statusCode}
                  </span>
                )}
                {evt.durationMs !== undefined && (
                  <span className="text-slate-400">{evt.durationMs}ms</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
