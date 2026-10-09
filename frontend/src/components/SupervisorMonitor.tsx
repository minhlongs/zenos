'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Skull, CheckCircle, Cpu, RefreshCw } from 'lucide-react';
import { SupervisorStatus } from '../types/factory';
import { getSupervisorStatus, killAllJails } from '../lib/zenos-client';

export function SupervisorMonitor() {
  const [status, setStatus] = useState<SupervisorStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [killing, setKilling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadStatus = async () => {
    setLoading(true);
    const data = await getSupervisorStatus();
    if (data) setStatus(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleKillAll = async () => {
    setKilling(true);
    const count = await killAllJails();
    setMessage(count !== null ? `Killed ${count} process groups` : 'Failed to kill process groups');
    await loadStatus();
    setKilling(false);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-semibold text-slate-100">Workstation Supervisor & Process Jail</h2>
          <span className="text-xs bg-sky-950 text-sky-400 border border-sky-800 px-2 py-0.5 rounded-full font-mono">
            GATE 8
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStatus}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs"
            title="Refresh Status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleKillAll}
            disabled={killing}
            className="flex items-center gap-1.5 bg-red-950 hover:bg-red-900 text-red-300 border border-red-800 text-xs px-2.5 py-1 rounded font-semibold"
          >
            <Skull className="w-3.5 h-3.5" />
            {killing ? 'Killing...' : 'Emergency Kill All'}
          </button>
        </div>
      </div>

      {message && (
        <div className="text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-800 px-3 py-1.5 rounded">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active PGID */}
        <div className="bg-slate-950 border border-slate-800/80 rounded p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-sky-400" /> Active Process Groups
            </span>
            <span className="font-mono text-sky-400 font-semibold">{status?.activeJails.length ?? 0}</span>
          </div>
          <p className="text-[11px] text-slate-500">Detached Process Groups isolated from main loop</p>
        </div>

        {/* SQLite Crash Recovery */}
        <div className="bg-slate-950 border border-slate-800/80 rounded p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Crash Reconciler
            </span>
            <span className="font-mono text-emerald-400 font-semibold">SYNCHRONIZED</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Recovered on boot: <span className="font-mono text-slate-300">{status?.bootReconciledCount ?? 0}</span>
          </p>
        </div>

        {/* Heartbeat Status */}
        <div className="bg-slate-950 border border-slate-800/80 rounded p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Daemon Pulse</span>
            <span className="font-mono text-slate-300 text-[10px]">
              {status?.lastHeartbeat ? status.lastHeartbeat.slice(11, 19) : 'Waiting'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Active Task Watchdogs: <span className="font-mono text-slate-300">{status?.activeCount ?? 0}</span>
          </p>
        </div>
      </div>

      {/* Jails Detail */}
      <div className="space-y-1.5">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Live Isolated Jails</h3>
        {(!status?.activeJails || status.activeJails.length === 0) ? (
          <div className="text-xs font-mono text-slate-500 bg-slate-950 border border-slate-800/60 p-3 rounded">
            No active child process groups. Workstation CPU and RAM idle.
          </div>
        ) : (
          <div className="space-y-2">
            {status.activeJails.map((jail) => (
              <div
                key={jail.jailId}
                className="bg-slate-950 border border-slate-800 rounded p-2.5 flex items-center justify-between font-mono text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 font-bold">PGID: {jail.pgid ?? 'N/A'}</span>
                    <span className="text-slate-400 text-[11px]">{jail.command}</span>
                  </div>
                  <div className="text-slate-500 text-[10px]">Started: {jail.startedAt.slice(11, 19)}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                  ISOLATED
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
