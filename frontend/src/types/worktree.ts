// frontend/src/types/worktree.ts - Type definitions for Gate 13 Worktree Console
'use strict';

export type BlastRiskLevel = 'SAFE' | 'CAUTION' | 'CRITICAL';

export interface WorktreeInstance {
  id: string;
  path: string;
  branch: string;
  headSha: string;
  isMain: boolean;
  isManaged: boolean;
  createdAt?: string;
}

export interface BlastRadiusReport {
  target: string;
  score: number;
  riskLevel: BlastRiskLevel;
  fanIn: number;
  fanOut: number;
  maxDepth: number;
  hasCycle: boolean;
  directDependents: string[];
  directDependencies: string[];
  transitiveUpstream: string[];
  transitiveDownstream: string[];
}

export interface BlastRadiusSummary {
  totalFiles: number;
  criticalCount: number;
  cautionCount: number;
  safeCount: number;
  averageBlastRadius: number;
}

export interface WorkspaceBlastAnalysis {
  summary: BlastRadiusSummary;
  topRisks: BlastRadiusReport[];
  all: BlastRadiusReport[];
}

export interface DiffFile {
  status: string;
  path: string;
}

export interface DiffSummary {
  stat: string;
  files: DiffFile[];
  changedFilesCount: number;
}

export interface DualKeyConsensus {
  approved: boolean;
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  reason: string;
  key1: { passed: boolean; reason: string };
  key2: { approved: boolean; reason: string };
  notes: string;
}

export interface StagedPr {
  id: string;
  branch: string;
  baseBranch: string;
  commitMessage: string;
  consensus: DualKeyConsensus;
  diffSummary: DiffSummary;
  approved: boolean;
  stagedAt: string;
}
