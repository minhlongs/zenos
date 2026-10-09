'use client';

import React, { useState } from 'react';
import { GoalStatus, GoalLifecycleState } from '../types/factory';
import { startGoal, updateGoalAction } from '../lib/zenos-client';
import { Target, Pause, Play, StopCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface GoalPipelineProps {
  currentGoal?: GoalStatus | null;
  onGoalChange?: (goal: GoalStatus) => void;
}

const STEPS: GoalLifecycleState[] = ['IDLE', 'PLANNING', 'COOKING', 'VERIFYING', 'COMPLETED'];

export function GoalPipeline({ currentGoal: propGoal, onGoalChange }: GoalPipelineProps) {
  const [goal, setGoal] = useState<GoalStatus | null>(propGoal || null);
  const [prompt, setPrompt] = useState('Build end-to-end user session token validator');
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    const created = await startGoal(prompt);
    if (created) {
      setGoal(created);
      onGoalChange?.(created);
    }
    setLoading(false);
  };

  const handleAction = async (action: 'pause' | 'resume' | 'abort') => {
    if (!goal || loading) return;
    setLoading(true);
    const ok = await updateGoalAction(goal.id, action);
    if (ok) {
      const updatedState: GoalLifecycleState = action === 'pause' ? 'PAUSED' : action === 'abort' ? 'ABORTED' : 'COOKING';
      const updated = { ...goal, state: updatedState };
      setGoal(updated);
      onGoalChange?.(updated);
    }
    setLoading(false);
  };

  const currentState = goal?.state || 'IDLE';

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-lg p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-semibold text-slate-100">
            Durable Milestone Goal Pipeline {goal && <span className="font-mono text-xs text-slate-400">({goal.id})</span>}
          </h2>
        </div>
        {goal && (
          <div className="flex items-center gap-2">
            {currentState === 'COOKING' ? (
              <button
                onClick={() => handleAction('pause')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
              >
                <Pause className="w-3 h-3 text-amber-400" /> Pause
              </button>
            ) : currentState === 'PAUSED' ? (
              <button
                onClick={() => handleAction('resume')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
              >
                <Play className="w-3 h-3 text-emerald-400" /> Resume
              </button>
            ) : null}
            <button
              onClick={() => handleAction('abort')}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-950 hover:bg-red-900 text-red-300 rounded border border-red-800"
            >
              <StopCircle className="w-3 h-3 text-red-400" /> Abort
            </button>
          </div>
        )}
      </div>

      {!goal ? (
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Define milestone goal..."
            className="flex-1 bg-[#020617] border border-[#1e293b] rounded-md px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
          />
          <button
            onClick={handleStart}
            disabled={loading}
            className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-md transition"
          >
            {loading ? 'Starting...' : 'Start Goal Pipeline'}
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-300 mb-4 font-medium">&quot;{goal.prompt}&quot;</p>
      )}

      {/* Stepper */}
      <div className="grid grid-cols-5 gap-2 mt-2">
        {STEPS.map((step, idx) => {
          const isActive = currentState === step;
          const isPast = STEPS.indexOf(currentState) > idx;
          return (
            <div
              key={step}
              className={`text-center py-2 px-1 rounded border text-xs font-semibold transition ${
                isActive
                  ? 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                  : isPast
                  ? 'border-slate-700 bg-slate-800/40 text-slate-400'
                  : 'border-[#1e293b] bg-[#020617] text-slate-600'
              }`}
            >
              {idx + 1}. {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
