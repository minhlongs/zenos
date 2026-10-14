// frontend/src/components/BrainstormConsole.tsx - Autonomous Brainstorming & Deep Socratic Debate Console
'use strict';

import React, { useState, useEffect, useCallback } from 'react';
import { BrainstormSession, ZenPlanDispatched, BrainstormStrategy, DebatePersona } from '../types/brainstorm';
import {
  startBrainstormSession, autoBrainstormHotspots, fetchBrainstormSessions, fetchBrainstormSession, dispatchBrainstormToZen
} from '../lib/zenos-brainstorm-client';
import { BrainstormStrategyPanel } from './BrainstormStrategyPanel';
import { Brain, Sparkles, AlertTriangle, RefreshCw, Flame } from 'lucide-react';

const PERSONA_STYLES: Record<DebatePersona, string> = {
  ADVOCATE: 'bg-emerald-950/30 border-emerald-500 text-emerald-200',
  ADVERSARY: 'bg-rose-950/30 border-rose-500 text-rose-200',
  CROSS_EXAMINER: 'bg-violet-950/30 border-violet-500 text-violet-200',
  REBUTTAL: 'bg-amber-950/30 border-amber-500 text-amber-200',
  SYNTHESIZER: 'bg-cyan-950/30 border-cyan-500 text-cyan-200'
};

export function BrainstormConsole() {
  const [sessions, setSessions] = useState<BrainstormSession[]>([]);
  const [activeSession, setActiveSession] = useState<BrainstormSession | null>(null);
  const [topic, setTopic] = useState('Modularize Monolithic Routes Factory');
  const [targetFile, setTargetFile] = useState('proxy/src/workflow/routes-factory.js');
  const [deepMode, setDeepMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [dispatchedPlan, setDispatchedPlan] = useState<ZenPlanDispatched | null>(null);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    const list = await fetchBrainstormSessions();
    setSessions(list);
    if (list.length > 0 && !activeSession) {
      const full = await fetchBrainstormSession(list[0].id);
      if (full) setActiveSession(full);
    }
    setLoading(false);
  }, [activeSession]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const handleStart = async () => {
    setLoading(true);
    const session = await startBrainstormSession({
      topic, targetFile, deep: deepMode, context: { blastRadius: 38, complexity: 24 }
    });
    if (session) { setActiveSession(session); await loadSessions(); }
    setLoading(false);
  };

  const handleAutoScan = async () => {
    setLoading(true);
    const batch = await autoBrainstormHotspots(3);
    if (batch.length > 0) { setActiveSession(batch[0]); await loadSessions(); }
    setLoading(false);
  };

  const handleDispatch = async (strategy: BrainstormStrategy) => {
    if (!activeSession) return;
    const plan = await dispatchBrainstormToZen({ sessionId: activeSession.id, strategyId: strategy.id });
    if (plan) setDispatchedPlan(plan);
  };

  const tel = activeSession?.telemetry;

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            Autonomous Architectural Brainstorming & Deep Code Introspection (Gate 14/15)
          </h2>
          <p className="text-xs text-slate-400 mt-1">5-Turn Socratic Dialectic, Live Codebase Telemetry, Hotspot Auto-Scan & Pareto Synthesis</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleAutoScan} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white rounded text-xs font-semibold">
            <Flame className="w-3.5 h-3.5" /> Auto-Scan Hotspots
          </button>
          <button onClick={loadSessions} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs font-semibold">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync ({sessions.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Refactoring Topic..." className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200" />
        <input value={targetFile} onChange={(e) => setTargetFile(e.target.value)} placeholder="Target File Path..." className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono" />
        <button onClick={() => setDeepMode(!deepMode)} className={`px-3 py-1.5 rounded text-xs font-mono font-bold border ${deepMode ? 'bg-violet-950/60 border-violet-500 text-violet-200' : 'bg-slate-900 border-slate-700 text-slate-400'}`}>
          {deepMode ? '--deep: ON (5-Turn AST)' : 'Standard (3-Turn)'}
        </button>
        <button onClick={handleStart} disabled={loading} className="flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold py-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Launch Socratic Debate
        </button>
      </div>

      {tel && (
        <div className="flex flex-wrap items-center gap-4 px-3 py-2 bg-slate-950/90 border border-violet-900/60 rounded text-xs font-mono text-slate-300">
          <span className="text-violet-400 font-bold">Live Codebase Telemetry:</span>
          <span>LOC: <strong>{tel.totalLines}</strong></span>
          <span>CCN Branches: <strong>{tel.branchingCount}</strong></span>
          <span>Fan-In / Fan-Out: <strong>{tel.fanIn} / {tel.fanOut}</strong></span>
          <span>Detected Seams: <strong>{tel.detectedSeams}</strong></span>
          <span>Monolith Score: <strong>{tel.monolithScore}</strong></span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-cyan-400" /> Socratic Dialectic Feed ({activeSession?.turns.length || 0} Turns)
          </h3>
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {activeSession?.turns.map((t, i) => (
              <div key={i} className={`p-3 rounded text-xs font-mono border-l-4 ${PERSONA_STYLES[t.persona]}`}>
                <div className="flex justify-between font-bold text-[11px] mb-1">
                  <span>[{t.persona}] {t.role}</span>
                  <span className="text-slate-500">{t.timestamp.slice(11, 19)}</span>
                </div>
                <p className="leading-relaxed">{t.argument}</p>
                {t.socraticQuestions && (
                  <ul className="mt-1.5 text-[11px] text-violet-300 list-disc list-inside space-y-0.5">
                    {t.socraticQuestions.map((q, qIdx) => <li key={qIdx}>{q}</li>)}
                  </ul>
                )}
                {t.invariantWarnings && (
                  <div className="mt-1.5 text-[11px] text-amber-300 space-y-0.5">
                    {t.invariantWarnings.map((w, idx) => (
                      <div key={idx} className="flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-amber-400 inline" /> {w}</div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-5">
          <BrainstormStrategyPanel strategies={activeSession?.strategies || []} splitBlueprint={activeSession?.splitBlueprint} dispatchedPlan={dispatchedPlan} onDispatch={handleDispatch} />
        </div>
      </div>
    </div>
  );
}
