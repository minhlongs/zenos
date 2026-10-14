// frontend/src/components/BrainstormStrategyPanel.tsx - Pareto Strategy, Split Blueprint & Dispatch Panel
'use strict';

import React from 'react';
import {
  BrainstormStrategy,
  ModuleSplitBlueprint,
  ZenPlanDispatched
} from '../types/brainstorm';
import { Sparkles, ArrowRight, CheckCircle2, Layers } from 'lucide-react';

interface BrainstormStrategyPanelProps {
  strategies: BrainstormStrategy[];
  splitBlueprint?: ModuleSplitBlueprint;
  dispatchedPlan: ZenPlanDispatched | null;
  onDispatch: (strategy: BrainstormStrategy) => void;
}

export function BrainstormStrategyPanel({
  strategies,
  splitBlueprint,
  dispatchedPlan,
  onDispatch
}: BrainstormStrategyPanelProps) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3 flex flex-col justify-between">
      <div className="space-y-3">
        <div>
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Pareto Candidate Strategies
          </h3>
          <div className="space-y-2">
            {strategies.map((strat) => (
              <div
                key={strat.id}
                className={`p-3 rounded border text-xs font-mono ${
                  strat.isRecommended
                    ? 'border-cyan-500/80 bg-cyan-950/20'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-200">{strat.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      strat.tier === 'SAFE'
                        ? 'bg-emerald-900 text-emerald-300'
                        : strat.tier === 'CAUTION'
                        ? 'bg-amber-900 text-amber-300'
                        : 'bg-rose-900 text-rose-300'
                    }`}
                  >
                    ARI {strat.ariScore} ({strat.tier})
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">{strat.description}</p>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>
                    BR: {strat.blastRadius} | CC: {strat.complexity} | Files:{' '}
                    {strat.estimatedTouchedFiles}
                  </span>
                  <button
                    onClick={() => onDispatch(strat)}
                    className="flex items-center gap-1 px-2 py-1 bg-cyan-800 hover:bg-cyan-700 text-cyan-100 rounded text-[11px]"
                  >
                    Dispatch <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {splitBlueprint && (
          <div className="p-3 rounded border border-violet-800/60 bg-violet-950/20 text-xs font-mono space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-violet-300 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-violet-400" /> Module Split Blueprint
            </div>
            <div className="text-[10px] text-slate-400">
              Facade: <span className="text-slate-200">{splitBlueprint.facadePath}</span>
            </div>
            <div className="space-y-1 pt-1">
              {splitBlueprint.extractedSubmodules.map((sub, idx) => (
                <div key={idx} className="text-[10px] text-violet-200 flex justify-between gap-2">
                  <span className="truncate">{sub.path}</span>
                  <span className="text-slate-400 shrink-0">
                    {sub.estimatedLoc} LOC • {sub.responsibility}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {dispatchedPlan && (
        <div className="mt-3 p-2.5 rounded text-xs font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800">
          <div className="flex items-center gap-1.5 font-bold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" /> Plan Dispatched to /zen
          </div>
          <div className="text-[11px] text-slate-300">
            {dispatchedPlan.strategyName} (ARI {dispatchedPlan.ariScore})
          </div>
        </div>
      )}
    </div>
  );
}
