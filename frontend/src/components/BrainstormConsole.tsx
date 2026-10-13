// frontend/src/components/BrainstormConsole.tsx - Autonomous Brainstorming & Socratic Debate Console
'use strict';

import React, { useState, useEffect, useCallback } from 'react';
import { BrainstormSession, ZenPlanDispatched, BrainstormStrategy } from '../types/brainstorm';
import {
  startBrainstormSession,
  fetchBrainstormSessions,
  fetchBrainstormSession,
  dispatchBrainstormToZen
} from '../lib/zenos-brainstorm-client';
import { Brain, Sparkles, AlertTriangle, ArrowRight, RefreshCw, CheckCircle2 } from 'lucide-react';

export function BrainstormConsole() {
  const [sessions, setSessions] = useState<BrainstormSession[]>([]);
  const [activeSession, setActiveSession] = useState<BrainstormSession | null>(null);
  const [topic, setTopic] = useState('Modularize Monolithic Routes Factory');
  const [targetFile, setTargetFile] = useState('proxy/src/workflow/routes-factory.js');
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
      topic,
      targetFile,
      context: { blastRadius: 38, complexity: 24 }
    });
    if (session) {
      setActiveSession(session);
      await loadSessions();
    }
    setLoading(false);
  };

  const handleDispatch = async (strategy: BrainstormStrategy) => {
    if (!activeSession) return;
    const plan = await dispatchBrainstormToZen({
      sessionId: activeSession.id,
      strategyId: strategy.id
    });
    if (plan) setDispatchedPlan(plan);
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 space-y-6">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
            Autonomous Architectural Brainstorming & Socratic Gating (Gate 14)
          </h2>
          <p className="text-xs text-slate-400 mt-1">Multi-Strategy Dialectic Debate, Architectural Risk Index (ARI) & Pareto Synthesis</p>
        </div>
        <button onClick={loadSessions} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-700 hover:bg-cyan-600 text-white rounded text-xs font-semibold">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Sync Sessions
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
        <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Refactoring Topic..." className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200" />
        <input value={targetFile} onChange={(e) => setTargetFile(e.target.value)} placeholder="Target File Path..." className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 font-mono" />
        <button onClick={handleStart} disabled={loading} className="flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold py-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Launch Deep Socratic Debate
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-cyan-400" /> Socratic Dialectic Feed ({activeSession?.turns.length || 0} Turns)
          </h3>
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {activeSession?.turns.map((t, i) => (
              <div key={i} className={`p-3 rounded text-xs font-mono border-l-4 ${
                t.persona === 'ADVOCATE' ? 'bg-emerald-950/30 border-emerald-500 text-emerald-200' :
                t.persona === 'ADVERSARY' ? 'bg-rose-950/30 border-rose-500 text-rose-200' :
                'bg-cyan-950/30 border-cyan-500 text-cyan-200'
              }`}>
                <div className="flex justify-between font-bold text-[11px] mb-1">
                  <span>[{t.persona}] {t.role}</span>
                  <span className="text-slate-500">{t.timestamp.slice(11, 19)}</span>
                </div>
                <p className="leading-relaxed">{t.argument}</p>
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

        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Pareto Candidate Strategies
            </h3>
            <div className="space-y-2">
              {activeSession?.strategies.map((strat) => (
                <div key={strat.id} className={`p-3 rounded border text-xs font-mono ${strat.isRecommended ? 'border-cyan-500/80 bg-cyan-950/20' : 'border-slate-800 bg-slate-900/60'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-200">{strat.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      strat.tier === 'SAFE' ? 'bg-emerald-900 text-emerald-300' :
                      strat.tier === 'CAUTION' ? 'bg-amber-900 text-amber-300' : 'bg-rose-900 text-rose-300'
                    }`}>ARI {strat.ariScore} ({strat.tier})</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">{strat.description}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>BR: {strat.blastRadius} | CC: {strat.complexity} | Files: {strat.estimatedTouchedFiles}</span>
                    <button onClick={() => handleDispatch(strat)} className="flex items-center gap-1 px-2 py-1 bg-cyan-800 hover:bg-cyan-700 text-cyan-100 rounded text-[11px]">
                      Dispatch <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {dispatchedPlan && (
            <div className="mt-3 p-2.5 rounded text-xs font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800">
              <div className="flex items-center gap-1.5 font-bold mb-1"><CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Plan Dispatched to /zen</div>
              <div className="text-[11px] text-slate-300">{dispatchedPlan.strategyName} (ARI {dispatchedPlan.ariScore})</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
