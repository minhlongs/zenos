'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { fetchBenchmarks, triggerEvalRun, fetchEvalRuns } from '../lib/zenos-eval-client';
import { EvalBenchmarkMeta, EvalRunSummary, EvalCaseResult } from '../types/eval';
import { Play, CheckCircle2, XCircle, RotateCw, Activity, Terminal, ShieldCheck } from 'lucide-react';

export function EvalConsole() {
  const [benchmarks, setBenchmarks] = useState<EvalBenchmarkMeta[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('all');
  const [isRunning, setIsRunning] = useState(false);
  const [runs, setRuns] = useState<EvalRunSummary[]>([]);
  const [activeSummary, setActiveSummary] = useState<EvalRunSummary | null>(null);
  const [selectedCase, setSelectedCase] = useState<EvalCaseResult | null>(null);

  const loadData = useCallback(async () => {
    const [bList, rList] = await Promise.all([fetchBenchmarks(), fetchEvalRuns(10)]);
    setBenchmarks(bList);
    setRuns(rList);
    if (rList.length > 0 && !activeSummary) setActiveSummary(rList[0]);
  }, [activeSummary]);

  useEffect(() => {
    loadData();
    const es = new EventSource(`${process.env.NEXT_PUBLIC_ZENOS_URL || 'http://127.0.0.1:4000'}/v1/factory/events`);
    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { type: string; payload: unknown };
        if (parsed.type === 'eval_summary') {
          setActiveSummary(parsed.payload as EvalRunSummary);
          setIsRunning(false);
          loadData();
        } else if (parsed.type === 'eval_error') {
          setIsRunning(false);
        }
      } catch { /* ignore non-json SSE */ }
    };
    return () => es.close();
  }, [loadData]);

  const handleRun = async (wait: boolean) => {
    if (isRunning) return;
    setIsRunning(true);
    const benchmarkId = selectedBenchmark === 'all' ? undefined : selectedBenchmark;
    const res = await triggerEvalRun({ benchmarkId, wait });
    if (wait && res?.summary) {
      setActiveSummary(res.summary);
      setIsRunning(false);
      loadData();
    } else if (!wait) {
      // background run
    } else {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 shadow-lg space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1e293b] pb-4 gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-100">SWE Micro-Benchmark & Self-Repair Console</h2>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedBenchmark}
            onChange={(e) => setSelectedBenchmark(e.target.value)}
            disabled={isRunning}
            className="bg-slate-900 border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Benchmarks ({benchmarks.length})</option>
            {benchmarks.map((b) => (
              <option key={b.id} value={b.id}>{b.title} ({b.id})</option>
            ))}
          </select>
          <button
            onClick={() => handleRun(true)}
            disabled={isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg transition"
          >
            {isRunning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Evaluating...' : 'Run Sync'}
          </button>
        </div>
      </div>

      {activeSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-[#1e293b] rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400">Pass@1 Accuracy</span>
            <div className="text-lg font-bold text-emerald-400 mt-1">
              {(activeSummary.pass_at_1 * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-900/80 border border-[#1e293b] rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400">Reflexion Recovery Rate</span>
            <div className="text-lg font-bold text-indigo-400 mt-1">
              {(activeSummary.recovery_rate * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-900/80 border border-[#1e293b] rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400">Resolved Cases</span>
            <div className="text-lg font-bold text-slate-100 mt-1">
              {activeSummary.passed_cases} / {activeSummary.total_cases}
            </div>
          </div>
          <div className="bg-slate-900/80 border border-[#1e293b] rounded-lg p-3">
            <span className="text-[11px] font-medium text-slate-400">Execution Latency</span>
            <div className="text-lg font-bold text-amber-400 mt-1">
              {activeSummary.total_duration_ms} ms
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Recent Benchmark Runs</h3>
        <div className="overflow-x-auto border border-[#1e293b] rounded-lg">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-[#1e293b]">
              <tr>
                <th className="px-3 py-2">Run ID</th>
                <th className="px-3 py-2">Pass@1</th>
                <th className="px-3 py-2">Recovery</th>
                <th className="px-3 py-2">Score</th>
                <th className="px-3 py-2">Latency</th>
                <th className="px-3 py-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {runs.map((r) => (
                <tr key={r.id} onClick={() => setActiveSummary(r)} className={`cursor-pointer hover:bg-slate-800/50 transition ${activeSummary?.id === r.id ? 'bg-slate-800/70' : ''}`}>
                  <td className="px-3 py-2 font-mono text-emerald-400">{r.id}</td>
                  <td className="px-3 py-2">{(r.pass_at_1 * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2">{(r.recovery_rate * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2">{r.passed_cases}/{r.total_cases}</td>
                  <td className="px-3 py-2">{r.total_duration_ms}ms</td>
                  <td className="px-3 py-2 text-slate-500">{new Date(r.created_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {activeSummary?.cases && activeSummary.cases.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Case Diagnostic Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeSummary.cases.map((c) => (
              <div key={c.benchmark_id} onClick={() => setSelectedCase(c)} className="bg-slate-900 border border-[#1e293b] rounded-lg p-3 cursor-pointer hover:border-slate-600 transition text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-medium text-slate-200">{c.benchmark_id}</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${c.final_pass ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'}`}>
                    {c.final_pass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {c.final_pass ? 'RESOLVED' : 'FAILED'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex gap-4">
                  <span>Initial: {c.initial_pass ? 'PASS' : 'FAIL'}</span>
                  <span>Repairs: {c.repair_attempts}</span>
                  <span>Duration: {c.duration_ms}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedCase?.critique_history && (
        <div className="bg-slate-950 border border-[#1e293b] rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            Reflexion Critique & Repair Log: {selectedCase.benchmark_id}
          </div>
          <pre className="text-[11px] font-mono text-slate-400 bg-slate-900 p-2.5 rounded overflow-x-auto whitespace-pre-wrap">
            {selectedCase.critique_history}
          </pre>
        </div>
      )}
    </div>
  );
}
