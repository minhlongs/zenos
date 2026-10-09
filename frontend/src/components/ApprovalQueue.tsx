'use strict';
import React, { useState } from 'react';
import { ApprovalRecord } from '../types/zenos';
import { resolveApprovalRequest } from '../lib/zenos-client';
import { ShieldCheck, ShieldAlert, Check, X } from 'lucide-react';

interface ApprovalQueueProps {
  approvals: ApprovalRecord[];
  onRefresh: () => void;
}

export function ApprovalQueue({ approvals, onRefresh }: ApprovalQueueProps) {
  const [submitting, setSubmitting] = useState<string | null>(null);

  const handleDecision = async (id: string, token: string, approved: boolean) => {
    setSubmitting(id);
    await resolveApprovalRequest(id, token, approved);
    setSubmitting(null);
    onRefresh();
  };

  return (
    <div className="bg-[#131a2a] border border-[#1e293b] rounded-lg p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-semibold text-slate-100">Human Approval Interlocks</h2>
        </div>
        <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
          {approvals.filter(a => a.status === 'pending').length} Pending
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#1e293b] text-slate-400 text-xs uppercase">
              <th className="pb-3 px-3">Action</th>
              <th className="pb-3 px-3">Command / Context</th>
              <th className="pb-3 px-3">Status</th>
              <th className="pb-3 px-3">Created</th>
              <th className="pb-3 px-3 text-right">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {approvals.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500">
                  <ShieldCheck className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  No pending security approval requests.
                </td>
              </tr>
            ) : (
              approvals.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3 font-medium text-slate-200">{req.action}</td>
                  <td className="py-3 px-3">
                    <code className="text-xs font-mono bg-slate-900 px-2 py-1 rounded text-slate-300">
                      {req.command || req.context || 'N/A'}
                    </code>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      req.status === 'pending' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                      req.status === 'approved' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-xs text-slate-400">
                    {new Date(req.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-3 text-right">
                    {req.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          disabled={submitting === req.id}
                          onClick={() => handleDecision(req.id, req.token, true)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve
                        </button>
                        <button
                          disabled={submitting === req.id}
                          onClick={() => handleDecision(req.id, req.token, false)}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-medium transition"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">Decided</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
