'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { triggerSwarmRun, fetchSwarmSessions, fetchSwarmSession } from '../lib/zenos-swarm-client';
import { SwarmSession, SwarmRole, ArtifactType, SwarmArtifact } from '../types/swarm';
import { Play, RotateCw, Users, Lock, Unlock, ShieldAlert } from 'lucide-react';

const ROLES: { role: SwarmRole; label: string; artifact: ArtifactType }[] = [
  { role: 'ARCHITECT', label: '1. ARCHITECT', artifact: 'SPEC' },
  { role: 'CODER', label: '2. CODER', artifact: 'CODE_DIFF' },
  { role: 'VERIFIER', label: '3. QA VERIFIER', artifact: 'TEST_OUTPUT' },
  { role: 'AUDITOR', label: '4. AUDITOR', artifact: 'AUDIT_REPORT' }
];

export function SwarmConsole() {
  const [objective, setObjective] = useState('');
  const [maxRounds, setMaxRounds] = useState(3);
  const [isRunning, setIsRunning] = useState(false);
  const [session, setSession] = useState<SwarmSession | null>(null);
  const [activeTab, setActiveTab] = useState<ArtifactType>('SPEC');

  const loadLatest = useCallback(async () => {
    const list = await fetchSwarmSessions(1);
    if (list.length > 0) {
      const full = await fetchSwarmSession(list[0].id);
      setSession(full || list[0]);
    }
  }, []);

  useEffect(() => {
    loadLatest();
    const url = `${process.env.NEXT_PUBLIC_ZENOS_URL || 'http://127.0.0.1:20129'}/v1/factory/events`;
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        const d = JSON.parse(e.data) as { type: string; payload?: Record<string, unknown>; sessionId?: string };
        if (d.type?.startsWith('swarm_')) {
          const sId = (d.payload?.sessionId as string) || d.sessionId || (d.payload?.id as string);
          if (sId) fetchSwarmSession(sId).then((s) => s && setSession(s));
          if (d.type === 'swarm_session_complete') setIsRunning(false);
        }
      } catch { /* ignore non-json */ }
    };
    return () => es.close();
  }, [loadLatest]);

  const handleLaunch = async () => {
    if (!objective.trim() || isRunning) return;
    setIsRunning(true);
    const res = await triggerSwarmRun({ objective: objective.trim(), maxRounds });
    if (res?.sessionId) {
      const s = await fetchSwarmSession(res.sessionId);
      if (s) setSession(s);
    }
    if (!res?.success) setIsRunning(false);
  };

  const getArtifact = (type: ArtifactType): SwarmArtifact | undefined =>
    session?.artifacts?.slice().reverse().find((a) => a.artifactType === type || a.artifact_type === type);

  const verifierPass = Boolean(session?.consensus?.verifierPass ?? session?.consensus?.verifier_pass);
  const auditorPass = Boolean(session?.consensus?.auditorPass ?? session?.consensus?.auditor_pass);
  const currentRole = (session?.currentRole || session?.current_role || '').toUpperCase();
  const activeArt = getArtifact(activeTab);

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 shadow-lg space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#1e293b] pb-4 gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
            <Users className="w-4 h-4 text-indigo-400" />
            Hierarchical Multi-Agent Swarm Orchestrator
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Turn-Based Blackboard State Machine & Dual-Key Consensus Gate</p>
        </div>
        <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-xs font-mono bg-indigo-950 text-indigo-300 border border-indigo-800">
          Turn: {session?.status || 'IDLE'} (R{session?.currentRound ?? 1}/{session?.maxRounds ?? maxRounds})
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="Enter swarm objective..."
          disabled={isRunning}
          className="flex-1 bg-slate-950 border border-[#334155] rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex items-center gap-2">
          <select
            value={maxRounds}
            onChange={(e) => setMaxRounds(Number(e.target.value))}
            disabled={isRunning}
            className="bg-slate-950 border border-[#334155] rounded-lg px-2 py-1.5 text-xs text-slate-300"
          >
            {[1, 2, 3, 5].map((r) => <option key={r} value={r}>{r} Rounds</option>)}
          </select>
          <button
            onClick={handleLaunch}
            disabled={isRunning || !objective.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg transition"
          >
            {isRunning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Orchestrating...' : 'Launch Swarm'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {ROLES.map(({ role, label, artifact }) => {
          const hasArt = Boolean(getArtifact(artifact));
          const isActive = currentRole.includes(role);
          const style = isActive ? 'bg-slate-900 border-indigo-500 ring-1 ring-indigo-500' : hasArt ? 'bg-slate-900 border-emerald-800/80 text-emerald-400' : 'bg-slate-950/60 border-[#1e293b] text-slate-400';
          return (
            <div key={role} className={`p-3 rounded-lg border transition ${style}`}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className={isActive ? 'text-indigo-300' : hasArt ? 'text-emerald-400' : 'text-slate-300'}>{label}</span>
                <span className="text-[10px] font-mono">{isActive ? 'ACTIVE' : hasArt ? `✓ ${artifact}` : 'WAITING'}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">
                {role === 'ARCHITECT' && 'Acceptance spec & bounds'}
                {role === 'CODER' && 'Modular diff implementation'}
                {role === 'VERIFIER' && 'ProcessJail test execution'}
                {role === 'AUDITOR' && 'Invariants & security audit'}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className={`p-3 bg-slate-950 border rounded-lg flex items-center justify-between ${verifierPass ? 'border-emerald-800' : 'border-slate-800'}`}>
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Key 1: Deterministic Test Witness</span>
            <span className="text-[11px] text-slate-400 font-mono">ProcessJail Exit Status</span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${verifierPass ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
            {verifierPass ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            {verifierPass ? 'LOCKED (PASS)' : 'PENDING'}
          </span>
        </div>
        <div className={`p-3 bg-slate-950 border rounded-lg flex items-center justify-between ${auditorPass ? 'border-emerald-800' : 'border-slate-800'}`}>
          <div>
            <span className="text-xs font-semibold text-slate-200 block">Key 2: Adversarial Audit Witness</span>
            <span className="text-[11px] text-slate-400 font-mono">Invariants & Code Guard</span>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${auditorPass ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-amber-950 text-amber-400 border-amber-800'}`}>
            {auditorPass ? <Lock className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
            {auditorPass ? 'LOCKED (PASS)' : 'PENDING'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2 text-xs">
          <span className="font-semibold text-slate-300">Blackboard Artifact Ledger</span>
          <div className="flex gap-1.5">
            {(['SPEC', 'CODE_DIFF', 'TEST_OUTPUT', 'AUDIT_REPORT'] as ArtifactType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition ${activeTab === tab ? 'bg-indigo-600 text-white font-semibold' : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <pre className="p-3 bg-slate-950 rounded-lg border border-[#1e293b] font-mono text-xs text-slate-300 overflow-x-auto max-h-56">
          {activeArt?.content || `No ${activeTab} artifact recorded for this session yet.`}
        </pre>
      </div>
    </div>
  );
}
