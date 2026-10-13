// frontend/src/lib/zenos-worktree-client.ts - Client SDK for Worktree Isolation & Blast Radius
import {
  WorktreeInstance,
  BlastRadiusReport,
  WorkspaceBlastAnalysis,
  StagedPr
} from '../types/worktree';

const BASE_URL = process.env.NEXT_PUBLIC_ZENOS_URL || 'http://127.0.0.1:20129';

export async function fetchWorktrees(): Promise<WorktreeInstance[]> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/worktree/list`);
    if (!res.ok) return [];
    const data = await res.json() as { worktrees: WorktreeInstance[] };
    return data.worktrees || [];
  } catch {
    return [];
  }
}

export async function createWorktree(id: string, branch?: string): Promise<WorktreeInstance | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/worktree/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, branch })
    });
    if (!res.ok) return null;
    const data = await res.json() as { worktree: WorktreeInstance };
    return data.worktree || null;
  } catch {
    return null;
  }
}

export async function removeWorktree(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/worktree/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchWorkspaceBlastRadius(): Promise<WorkspaceBlastAnalysis | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/worktree/blast-radius`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scope: 'workspace' })
    });
    if (!res.ok) return null;
    return await res.json() as WorkspaceBlastAnalysis;
  } catch {
    return null;
  }
}

export async function fetchFileBlastRadius(targetPath: string): Promise<BlastRadiusReport | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/worktree/blast-radius`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetPath })
    });
    if (!res.ok) return null;
    return await res.json() as BlastRadiusReport;
  } catch {
    return null;
  }
}

export interface StagePrOptions {
  worktreePath: string;
  type?: string;
  scope?: string;
  subject?: string;
  body?: string;
}

export async function stagePr(options: StagePrOptions): Promise<StagedPr | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/worktree/stage-pr`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });
    if (!res.ok) return null;
    return await res.json() as StagedPr;
  } catch {
    return null;
  }
}

export async function promoteWorktree(
  worktreePath: string,
  baseBranch: string = 'main'
): Promise<{ success: boolean; mergeSha?: string } | null> {
  try {
    const res = await fetch(`${BASE_URL}/v1/factory/worktree/promote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ worktreePath, baseBranch })
    });
    if (!res.ok) return null;
    return await res.json() as { success: boolean; mergeSha?: string };
  } catch {
    return null;
  }
}
