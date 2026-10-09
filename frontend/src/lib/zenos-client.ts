import { TelemetrySummary, ApprovalRecord, TelemetryEvent } from '../types/zenos';
import { ZenPlan, CookCycleResult, GoalStatus, SupervisorStatus } from '../types/factory';

const BASE_URL = process.env.NEXT_PUBLIC_ZENOS_URL || 'http://127.0.0.1:4000';

export async function fetchTelemetry(): Promise<{ summary: TelemetrySummary; recentEvents: TelemetryEvent[] } | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/telemetry`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json() as TelemetrySummary & { recentEvents: TelemetryEvent[] };
    const { recentEvents, ...summary } = data;
    return { summary, recentEvents: recentEvents || [] };
  } catch {
    return null;
  }
}

export async function fetchApprovals(): Promise<ApprovalRecord[]> {
  try {
    const res = await fetch(`${BASE_URL}/v1/approvals`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json() as { approvals: ApprovalRecord[] };
    return data.approvals || [];
  } catch {
    return [];
  }
}

export async function resolveApprovalRequest(
  id: string,
  token: string,
  approved: boolean,
  decidedBy = 'web_operator'
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${BASE_URL}/v1/approvals/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, approved, decidedBy })
    });
    if (!res.ok) {
      const err = await res.json() as { error?: string };
      return { success: false, error: err.error || 'Failed to resolve approval' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

export async function triggerZen(goal: string): Promise<ZenPlan | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/zen`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal })
    });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; plan: ZenPlan };
    return data.plan;
  } catch {
    return null;
  }
}

export async function runCook(testCommand?: string, targetFiles?: string[]): Promise<CookCycleResult | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/cook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testCommand, targetFiles })
    });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; result: CookCycleResult };
    return data.result;
  } catch {
    return null;
  }
}

export async function startGoal(prompt: string): Promise<GoalStatus | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/goal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; goal: GoalStatus };
    return data.goal;
  } catch {
    return null;
  }
}

export async function getGoal(id: string): Promise<GoalStatus | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/goal/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; goal: GoalStatus };
    return data.goal;
  } catch {
    return null;
  }
}

export async function updateGoalAction(id: string, action: 'pause' | 'resume' | 'abort'): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/goal/${encodeURIComponent(id)}/${action}`, {
      method: 'POST'
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getSupervisorStatus(): Promise<SupervisorStatus | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/supervisor/status`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json() as { status: string; supervisor: SupervisorStatus };
    return data.supervisor;
  } catch {
    return null;
  }
}

export async function killAllJails(): Promise<number | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/supervisor/kill-all`, { method: 'POST' });
    if (!res.ok) return null;
    const data = await res.json() as { success: boolean; killedCount: number };
    return data.killedCount;
  } catch {
    return null;
  }
}
