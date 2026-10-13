// frontend/src/lib/zenos-brainstorm-client.ts
'use strict';

import { BrainstormSession, ZenPlanDispatched } from '../types/brainstorm';

const API_BASE = process.env.NEXT_PUBLIC_ZENOS_API_URL || 'http://localhost:4000';

export async function startBrainstormSession(params: {
  topic: string;
  targetFile?: string;
  context?: { blastRadius?: number; complexity?: number };
}): Promise<BrainstormSession | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/factory/brainstorm/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { session: BrainstormSession };
    return data.session;
  } catch {
    return null;
  }
}

export async function fetchBrainstormSessions(): Promise<BrainstormSession[]> {
  try {
    const res = await fetch(`${API_BASE}/v1/factory/brainstorm/sessions`);
    if (!res.ok) return [];
    const data = (await res.json()) as { sessions: BrainstormSession[] };
    return data.sessions || [];
  } catch {
    return [];
  }
}

export async function fetchBrainstormSession(id: string): Promise<BrainstormSession | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/factory/brainstorm/session/${id}`);
    if (!res.ok) return null;
    const data = (await res.json()) as { session: BrainstormSession };
    return data.session;
  } catch {
    return null;
  }
}

export async function dispatchBrainstormToZen(params: {
  sessionId: string;
  strategyId?: string;
}): Promise<ZenPlanDispatched | null> {
  try {
    const res = await fetch(`${API_BASE}/v1/factory/brainstorm/dispatch-zen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { zenPlan: ZenPlanDispatched };
    return data.zenPlan;
  } catch {
    return null;
  }
}
