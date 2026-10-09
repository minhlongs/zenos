import { TelemetrySummary, ApprovalRecord, TelemetryEvent } from '../types/zenos';

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
