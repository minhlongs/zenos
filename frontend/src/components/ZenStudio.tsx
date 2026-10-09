'use client';

import React, { useState } from 'react';
import { ZenPlan } from '../types/factory';
import { triggerZen } from '../lib/zenos-client';
import { Sparkles, Cpu, Layers, FileCode, CheckCircle2, Cloud } from 'lucide-react';

export function ZenStudio() {
  const [goal, setGoal] = useState('Implement reactive state store with subscriptions');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<ZenPlan | null>(null);

  const handleGenerate = async () => {
    if (!goal.trim() || loading) return;
    setLoading(true);
    const result = await triggerZen(goal);
    if (result) setPlan(result);
    setLoading(false);
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-semibold text-slate-100">Zen Cognitive Studio</h2>
        </div>
        {plan && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            plan.modelRoute.provider === 'local'
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : 'bg-violet-950 text-violet-300 border-violet-800'
          }`}>
            {plan.modelRoute.provider === 'local' ? <Cpu className="w-3 h-3" /> : <Cloud className="w-3 h-3" />}
            {plan.modelRoute.model} (Score: {plan.complexityScore}/5)
          </span>
        )}
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Natural language goal planning & architecture decomposition with dynamic Metal GPU routing.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Describe your architecture goal..."
          className="flex-1 bg-[#020617] border border-[#1e293b] rounded-md px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-md transition flex items-center gap-1.5"
        >
          {loading ? 'Planning...' : 'Generate Plan'}
        </button>
      </div>

      {plan && (
        <div className="space-y-3 pt-3 border-t border-[#1e293b]">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Strategy:</span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {plan.strategy}
            </span>
            <span className="ml-2 font-semibold text-slate-200">Files:</span>
            <span>{plan.files.length}</span>
            <span className="ml-2 font-semibold text-slate-200">Tests:</span>
            <span>{plan.tests.length}</span>
          </div>

          <div className="space-y-2">
            {plan.phases.map((phase, idx) => (
              <div key={idx} className="bg-[#020617] border border-[#1e293b] rounded-md p-3 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-200">
                    <Layers className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{phase.name}</span>
                  </div>
                  <span className="text-slate-400">{phase.action}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {phase.files.map((file, fIdx) => (
                    <span key={fIdx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                      <FileCode className="w-3 h-3 text-slate-500" />
                      {file}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
