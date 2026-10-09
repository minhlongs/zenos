import { EvalBenchmarkMeta, EvalRunSummary } from '../types/eval';

const BASE_URL = process.env.NEXT_PUBLIC_ZENOS_URL || 'http://127.0.0.1:4000';

export async function fetchBenchmarks(): Promise<EvalBenchmarkMeta[]> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/eval/benchmarks`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as { benchmarks: EvalBenchmarkMeta[] };
    return data.benchmarks || [];
  } catch {
    return [];
  }
}

export async function triggerEvalRun(options: {
  benchmarkId?: string;
  benchmarkIds?: string[];
  wait?: boolean;
}): Promise<{ success: boolean; summary?: EvalRunSummary; runId?: string } | null> {
  try {
    const waitParam = options.wait ? '?wait=true' : '';
    const res = await fetch(`${BASE_URL}/v1/factory/eval/run${waitParam}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!res.ok) return null;
    return (await res.json()) as { success: boolean; summary?: EvalRunSummary; runId?: string };
  } catch {
    return null;
  }
}

export async function fetchEvalRuns(limit = 20): Promise<EvalRunSummary[]> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/eval/runs?limit=${limit}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as { runs: EvalRunSummary[] };
    return data.runs || [];
  } catch {
    return [];
  }
}

export async function fetchEvalRunDetails(id: string): Promise<EvalRunSummary | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/eval/runs/${encodeURIComponent(id)}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as { run: EvalRunSummary };
    return data.run || null;
  } catch {
    return null;
  }
}
