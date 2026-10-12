// frontend/src/components/RefactorConsole.tsx - Refactor Console Component
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { WorkspaceAnalysis, SlicePlan, RefactorConsensusResult } from '../types/refactor';
import { fetchRefactorAnalysis, generateSlicePlan, applyRefactorPlan } from '../lib/zenos-refactor-client';
import { Shield, Play, Layers, Code, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';

export function RefactorConsole() {
  const [analysis, setAnalysis] = useState<WorkspaceAnalysis | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<SlicePlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [result, setResult] = useState<RefactorConsensusResult | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    const data = await fetchRefactorAnalysis();
    if (data) setAnalysis(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadMetrics(); }, [loadMetrics]);

  const handlePlan = async (filePath: string) => {
    setLoading(true);
    const res = await generateSlicePlan(filePath);
    if (res) setSelectedPlan(res.plan);
    setLoading(false);
  };

  const handleApply = async () => {
    if (!selectedPlan) return;
    setApplying(true);
    const res = await applyRefactorPlan(selectedPlan);
    setResult(res);
    setApplying(false);
    loadMetrics();
  };

  const summary = analysis?.summary;

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 space-y-6">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse" />
            Autonomous Code Refactoring & Complexity Engine (Gate 12)
          </h2>
          <p className="text-xs text-slate-400 mt-1">Lightweight AST-Guided Slicing, Complexity Heatmaps & Dual-Key TDD Safety</p>
        </div>
        <button onClick={loadMetrics} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs font-semibold">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Scan Workspace
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Workspace Health Score</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{summary ? `${summary.workspaceHealthScore}%` : '--'}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Compliant with &lt; 200 LOC ceiling</p>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Scanned Modules</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{summary?.totalFiles || 0} Files</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Pure Node.js + Frontend TS</p>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">High Risk Monoliths</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{summary?.highRiskFilesCount || 0} Files</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Candidates for AST slicing</p>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Dual-Key Safety Status</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1 flex items-center gap-1.5"><Shield className="w-5 h-5" /> ARMED</div>
          <p className="text-[11px] text-slate-500 mt-0.5">ProcessJail TDD + Invariant Audit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Code className="w-4 h-4 text-cyan-400" /> Monolith Candidates</h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-500 border-b border-slate-800">
                <tr><th className="pb-2">Target</th><th className="pb-2">LOC</th><th className="pb-2">Branches</th><th className="pb-2">Risk</th><th className="pb-2 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {analysis?.files.slice(0, 8).map((f) => (
                  <tr key={f.filePath} className="hover:bg-slate-900/40">
                    <td className="py-2 text-slate-300 truncate max-w-[140px]">{f.fileName}</td>
                    <td className={`py-2 ${f.totalLines >= 180 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>{f.totalLines}</td>
                    <td className="py-2 text-slate-400">{f.branchingCount}</td>
                    <td className="py-2"><span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">{f.monolithScore} ({f.riskLevel})</span></td>
                    <td className="py-2 text-right"><button onClick={() => handlePlan(f.filePath)} className="px-2 py-0.5 bg-cyan-900 hover:bg-cyan-800 text-cyan-200 rounded text-[11px]">Plan Slice</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Layers className="w-4 h-4 text-cyan-400" /> Slicing Preview</h3>
            {selectedPlan ? (
              <div className="space-y-2 text-xs font-mono">
                <div className="text-slate-400">Target: <span className="text-cyan-300">{selectedPlan.targetFile.split('/').pop()}</span></div>
                <div className="space-y-1">
                  {selectedPlan.newFiles.map((nf) => (
                    <div key={nf.relativePath} className="text-emerald-400 text-[11px]">&gt; {nf.relativePath.split('/').pop()} ({nf.symbolsExported.length} symbols)</div>
                  ))}
                  <div className="text-cyan-400 text-[11px]">&gt; Facade Barrel: {selectedPlan.barrelFacade.relativePath.split('/').pop()}</div>
                </div>
              </div>
            ) : <p className="text-xs text-slate-500 font-mono">Select a monolith to preview AST decomposition.</p>}
          </div>

          {result && (
            <div className={`mt-3 p-2 rounded text-xs font-mono border ${result.success ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800' : 'bg-rose-950/40 text-rose-300 border-rose-800'}`}>
              <div className="flex items-center gap-1.5 font-bold">{result.success ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />} {result.success ? 'Dual-Key Consensus Passed' : 'Rollback Triggered'}</div>
              <div className="text-[11px] mt-1">{result.success ? result.consensus?.reason : result.error}</div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-800 mt-3 flex justify-end">
            <button disabled={!selectedPlan || applying} onClick={handleApply} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded text-xs font-semibold">
              <Play className="w-3.5 h-3.5" /> {applying ? 'Applying...' : 'Execute Atomic Refactor'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
