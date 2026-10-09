'use client';

import React, { useState, useEffect } from 'react';
import { runAgentTask } from '../lib/zenos-client';
import { AgentEventMessage } from '../types/factory';
import { Bot, Play, CheckCircle2, AlertTriangle, Terminal, Code, MessageSquare } from 'lucide-react';

export function AgentConsole() {
  const [prompt, setPrompt] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [events, setEvents] = useState<AgentEventMessage[]>([]);
  const [finalOutput, setFinalOutput] = useState<string | null>(null);

  useEffect(() => {
    const sseUrl = `${process.env.NEXT_PUBLIC_ZENOS_URL || 'http://127.0.0.1:4000'}/v1/factory/events`;
    const es = new EventSource(sseUrl);

    es.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { type: string; payload: unknown };
        if (parsed.type.startsWith('agent_')) {
          const agentEvt = { type: parsed.type, ...(parsed.payload as object) } as AgentEventMessage;
          setEvents((prev) => [...prev, agentEvt]);
          if (agentEvt.type === 'agent_complete' && agentEvt.output) {
            setFinalOutput(agentEvt.output);
            setIsRunning(false);
          }
          if (agentEvt.type === 'agent_error') {
            setIsRunning(false);
          }
        }
      } catch {
        // Ignore unparseable SSE frames
      }
    };

    return () => es.close();
  }, []);

  const handleRun = async () => {
    if (!prompt.trim() || isRunning) return;
    setIsRunning(true);
    setEvents([]);
    setFinalOutput(null);
    const res = await runAgentTask(prompt.trim());
    if (res?.taskId) {
      setTaskId(res.taskId);
    } else {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <Bot className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-100">Autonomous ReAct Agent Console</h2>
        </div>
        {taskId && (
          <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-slate-800 text-indigo-300 border border-indigo-500/30">
            {taskId}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="E.g., Inspect proxy test suites and verify all pass"
          disabled={isRunning}
          className="flex-1 bg-slate-900 border border-[#334155] rounded-lg px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
        />
        <button
          onClick={handleRun}
          disabled={isRunning || !prompt.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold rounded-lg transition"
        >
          <Play className="w-3.5 h-3.5" /> {isRunning ? 'Running...' : 'Run Agent'}
        </button>
      </div>

      <div className="bg-slate-950 border border-slate-900 rounded-lg p-3 min-h-[160px] max-h-[360px] overflow-y-auto space-y-2 text-xs font-mono">
        {events.length === 0 && !finalOutput && (
          <p className="text-slate-600 italic">No agent task active. Enter a goal above to start the autonomous Reason+Act loop.</p>
        )}

        {events.map((evt, idx) => (
          <div key={idx} className="p-2 rounded bg-slate-900/60 border border-slate-800">
            {evt.type === 'agent_thought' && (
              <div className="text-indigo-300 flex items-start gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-indigo-400 shrink-0" />
                <span>[Thought #{evt.iteration}] {evt.thought}</span>
              </div>
            )}
            {evt.type === 'agent_tool_call' && (
              <div className="text-amber-300 flex items-start gap-1.5 mt-1">
                <Terminal className="w-3.5 h-3.5 mt-0.5 text-amber-400 shrink-0" />
                <span>[Tool Call: {evt.tool}] {JSON.stringify(evt.args)}</span>
              </div>
            )}
            {evt.type === 'agent_tool_result' && (
              <div className="text-emerald-300 flex items-start gap-1.5 mt-1">
                <Code className="w-3.5 h-3.5 mt-0.5 text-emerald-400 shrink-0" />
                <span>[Observation: {evt.tool}] {evt.result?.output || (evt.result?.success ? 'Success' : 'Error')}</span>
              </div>
            )}
            {evt.type === 'agent_error' && (
              <div className="text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>[Error] {evt.error}</span>
              </div>
            )}
          </div>
        ))}

        {finalOutput && (
          <div className="p-2.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-200">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Final Answer
            </div>
            <p className="whitespace-pre-wrap">{finalOutput}</p>
          </div>
        )}
      </div>
    </div>
  );
}
