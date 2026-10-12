// frontend/src/lib/zenos-refactor-client.ts - Client SDK for Refactor Engine
import { WorkspaceAnalysis, SlicePlan, RefactorConsensusResult } from '../types/refactor';

const BASE_URL = process.env.NEXT_PUBLIC_ZENOS_URL || 'http://127.0.0.1:20129';

export async function fetchRefactorAnalysis(path?: string): Promise<WorkspaceAnalysis | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/refactor/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: path || '.' })
    });
    if (!res.ok) return null;
    return await res.json() as WorkspaceAnalysis;
  } catch {
    return null;
  }
}

export async function generateSlicePlan(filePath: string): Promise<{ targetFile: string; plan: SlicePlan } | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/refactor/plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });
    if (!res.ok) return null;
    return await res.json() as { targetFile: string; plan: SlicePlan };
  } catch {
    return null;
  }
}

export async function applyRefactorPlan(plan: SlicePlan, testCommand?: string): Promise<RefactorConsensusResult | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/refactor/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan, testCommand })
    });
    return await res.json() as RefactorConsensusResult;
  } catch {
    return null;
  }
}
