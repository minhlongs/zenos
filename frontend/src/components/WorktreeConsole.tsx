// frontend/src/components/WorktreeConsole.tsx - Worktree Isolation & Blast Radius Console
'use strict';

import React, { useState, useEffect, useCallback } from 'react';
import {
  WorktreeInstance,
  WorkspaceBlastAnalysis,
  BlastRadiusReport,
  StagedPr
} from '../types/worktree';
import {
  fetchWorktrees,
  fetchWorkspaceBlastRadius,
  fetchFileBlastRadius,
  removeWorktree,
  stagePr,
  promoteWorktree
} from '../lib/zenos-worktree-client';
import { GitBranch, Shield, RefreshCw, Trash2, CheckCircle, Radio } from 'lucide-react';

export function WorktreeConsole() {
  const [worktrees, setWorktrees] = useState<WorktreeInstance[]>([]);
  const [blastData, setBlastData] = useState<WorkspaceBlastAnalysis | null>(null);
  const [selectedRadius, setSelectedRadius] = useState<BlastRadiusReport | null>(null);
  const [stagedPrResult, setStagedPrResult] = useState<StagedPr | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [wts, blast] = await Promise.all([
      fetchWorktrees(),
      fetchWorkspaceBlastRadius()
    ]);
    setWorktrees(wts);
    setBlastData(blast);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleInspect = async (path: string) => {
    const res = await fetchFileBlastRadius(path);
    if (res) setSelectedRadius(res);
  };

  const handlePurge = async (id: string) => {
    setActionLoading(true);
    await removeWorktree(id);
    await loadData();
    setActionLoading(false);
  };

  const handleStagePr = async (wt: WorktreeInstance) => {
    setActionLoading(true);
    const res = await stagePr({
      worktreePath: wt.path,
      type: 'feat',
      scope: 'worktree',
      subject: `autonomous update on ${wt.id}`
    });
    setStagedPrResult(res);
    setActionLoading(false);
  };

  const handlePromote = async (wt: WorktreeInstance) => {
    setActionLoading(true);
    await promoteWorktree(wt.path, 'main');
    await loadData();
    setActionLoading(false);
  };

  const summary = blastData?.summary;

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 space-y-6">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            Git Worktree Isolation & Blast Radius Cartography (Gate 13)
          </h2>
          <p className="text-xs text-slate-400 mt-1">Zero-Dependency Git Jail, Transitive Call Graph & Dual-Key Semantic PR Stager</p>
        </div>
        <button onClick={loadData} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-semibold">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Fleet
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Active Worktrees</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{worktrees.length} Fleet</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Ephemeral isolation in .zenos/</p>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Monitored Modules</div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{summary?.totalFiles || 0} Files</div>
          <p className="text-[11px] text-slate-500 mt-0.5">Direct & transitive call graphs</p>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Average Blast Radius</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{summary?.averageBlastRadius || 0} / 100</div>
          <p className="text-[11px] text-slate-500 mt-0.5">{summary?.criticalCount || 0} Critical / {summary?.cautionCount || 0} Caution</p>
        </div>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
          <div className="text-xs text-slate-400">Dual-Key Consensus</div>
          <div className="text-2xl font-bold text-blue-400 mt-1 flex items-center gap-1.5"><Shield className="w-5 h-5" /> ARMED</div>
          <p className="text-[11px] text-slate-500 mt-0.5">ProcessJail Test + Invariant Audit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-blue-400" /> Ephemeral Worktree Fleet
          </h3>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-500 border-b border-slate-800">
                <tr><th className="pb-2">ID</th><th className="pb-2">Branch</th><th className="pb-2">Type</th><th className="pb-2 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {worktrees.map((wt) => (
                  <tr key={wt.id} className="hover:bg-slate-900/40">
                    <td className="py-2 text-slate-300">{wt.id}</td>
                    <td className="py-2 text-blue-300 truncate max-w-[120px]">{wt.branch}</td>
                    <td className="py-2">{wt.isMain ? <span className="text-emerald-400 font-bold">Main</span> : <span className="text-slate-400">Isolated</span>}</td>
                    <td className="py-2 text-right space-x-1">
                      {!wt.isMain && (
                        <>
                          <button disabled={actionLoading} onClick={() => handleStagePr(wt)} className="px-2 py-0.5 bg-blue-900 hover:bg-blue-800 text-blue-200 rounded text-[11px]">Stage PR</button>
                          <button disabled={actionLoading} onClick={() => handlePromote(wt)} className="px-2 py-0.5 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 rounded text-[11px]">Promote</button>
                          <button disabled={actionLoading} onClick={() => handlePurge(wt.id)} className="p-1 text-rose-400 hover:text-rose-300 rounded"><Trash2 className="w-3.5 h-3.5 inline" /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-blue-400" /> Blast Radius Cartography
            </h3>
            {selectedRadius ? (
              <div className="space-y-2 text-xs font-mono">
                <div className="text-slate-400">Target: <span className="text-blue-300">{selectedRadius.target}</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="text-slate-500">Score & Risk:</span>
                  <span className="text-amber-400 font-bold">{selectedRadius.score} ({selectedRadius.riskLevel})</span>
                </div>
                <div className="text-[11px] text-slate-400">Fan-In: {selectedRadius.fanIn} | Fan-Out: {selectedRadius.fanOut} | Depth: {selectedRadius.maxDepth}</div>
                <div className="text-[11px] text-slate-500">Transitive Upstream: {selectedRadius.transitiveUpstream.join(', ') || 'None'}</div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-mono mb-2">High Impact Modules:</p>
                {blastData?.topRisks.slice(0, 4).map((r) => (
                  <div key={r.target} onClick={() => handleInspect(r.target)} className="cursor-pointer flex justify-between p-1.5 rounded hover:bg-slate-900 text-[11px] font-mono border border-slate-800/40">
                    <span className="text-slate-300 truncate max-w-[150px]">{r.target}</span>
                    <span className="text-amber-400">{r.score} BR</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {stagedPrResult && (
            <div className="mt-3 p-2 rounded text-xs font-mono bg-blue-950/40 text-blue-300 border border-blue-800">
              <div className="flex items-center gap-1.5 font-bold"><CheckCircle className="w-3.5 h-3.5 text-blue-400" /> PR Staged ({stagedPrResult.consensus.status})</div>
              <div className="text-[11px] mt-0.5 truncate">{stagedPrResult.commitMessage}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
