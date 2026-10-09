import {
  SwarmSession,
  SwarmRunOptions,
  SwarmRunResponse
} from '../types/swarm';

const BASE_URL =
  process.env.NEXT_PUBLIC_ZENOS_URL ||
  process.env.NEXT_PUBLIC_PROXY_URL ||
  'http://127.0.0.1:20129';

export async function triggerSwarmRun(
  options: SwarmRunOptions
): Promise<SwarmRunResponse | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/swarm/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }
    const data = (await res.json()) as SwarmRunResponse;
    return data;
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Network error';
    return { success: false, error: errorMsg };
  }
}

export async function fetchSwarmSessions(limit = 20): Promise<SwarmSession[]> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/swarm/sessions?limit=${limit}`, {
      cache: 'no-store'
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { sessions?: SwarmSession[] } | SwarmSession[];
    if (Array.isArray(data)) return data;
    return data.sessions || [];
  } catch {
    return [];
  }
}

export async function fetchSwarmSession(id: string): Promise<SwarmSession | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/swarm/sessions/${encodeURIComponent(id)}`, {
      cache: 'no-store'
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { session?: SwarmSession } | SwarmSession;
    if ('session' in data && data.session) return data.session;
    return (data as SwarmSession) || null;
  } catch {
    return null;
  }
}
