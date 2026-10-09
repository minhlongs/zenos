'use client';

import React, { useState } from 'react';
import { CookCycleResult } from '../types/factory';
import { runCook } from '../lib/zenos-client';
import { Terminal, Play, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react';

interface CookConsoleProps {
  externalLogs?: string[];
}

export function CookConsole({ externalLogs = [] }: CookConsoleProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CookCycleResult | null>(null);

  const handleRunCook = async () => {
    if (loading) return;
    setLoading(true);
    const res = await runCook('node --test tests/store.test.js', ['src/store.js', 'tests/store.test.js']);
    if (res) setResult(res);
    setLoading(false);
  };

  const isCircuitBreaker = result?.status === 'CIRCUIT_BREAKER_TRIGGERED';

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-slate-100">Cook TDD Runner Console</h2>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              isCircuitBreaker
                ? 'bg-red-950 text-red-300 border-red-800'
                : 'bg-amber-950 text-amber-300 border-amber-800'
            }`}>
              {isCircuitBreaker ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
              {isCircuitBreaker ? 'Circuit Breaker Triggered' : `Cycle ${result.cycle} / 5`}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Automated test-driven execution loop with &lt; 200 LOC enforcement and circuit breaker safety.
      </p>

      {/* Terminal View */}
      <div className="bg-[#020617] border border-[#1e293b] rounded-md p-3.5 font-mono text-xs text-slate-300 h-44 overflow-y-auto space-y-1">
        {result ? (
          <div>
            <div className="text-amber-400">[COOK] Test Command Completed with exit code {result.exitCode}</div>
            {result.locAudit.files.map((f, i) => (
              <div key={i} className={f.ok ? 'text-emerald-400' : 'text-red-400'}>
                [LOC-GUARD] {f.file}: {f.loc} LOC ({f.ok ? 'OK < 200' : 'VIOLATION'})
              </div>
            ))}
            <div className="whitespace-pre-wrap text-slate-400 mt-2">{result.output}</div>
          </div>
        ) : externalLogs.length > 0 ? (
          externalLogs.map((log, i) => <div key={i} className="text-slate-300">{log}</div>)
        ) : (
          <div className="text-slate-600 italic">No active Cook cycles. Press &quot;Run Cook Cycle&quot; to begin.</div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1e293b]">
        <div className="flex items-center gap-2">
          {result?.locAudit.passed && (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              All touched files &lt; 200 LOC
            </span>
          )}
        </div>
        <button
          onClick={handleRunCook}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-semibold rounded-md border border-slate-700 transition"
        >
          <Play className="w-3 h-3 text-emerald-400" />
          {loading ? 'Running...' : 'Run Cook Cycle'}
        </button>
      </div>
    </div>
  );
}
