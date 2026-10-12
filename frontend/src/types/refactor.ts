// frontend/src/types/refactor.ts - Type definitions for Gate 12 Refactor Console

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface FileComplexity {
  filePath: string;
  fileName: string;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  branchingCount: number;
  branchingDensity: number;
  monolithScore: number;
  riskLevel: RiskLevel;
  fanOut: number;
  imports: string[];
  exportsCount: number;
}

export interface WorkspaceSummary {
  totalFiles: number;
  totalLines: number;
  averageComplexity: number;
  highRiskFilesCount: number;
  workspaceHealthScore: number;
}

export interface WorkspaceAnalysis {
  files: FileComplexity[];
  summary: WorkspaceSummary;
}

export interface SliceFile {
  relativePath: string;
  content: string;
  symbolsExported: string[];
}

export interface SlicePlan {
  targetFile: string;
  newFiles: SliceFile[];
  barrelFacade: {
    relativePath: string;
    content: string;
  };
  estimatedLocs: number[];
}

export interface RefactorConsensusResult {
  success: boolean;
  error?: string;
  plan?: SlicePlan;
  consensus?: {
    approved: boolean;
    status: 'APPROVED' | 'REJECTED' | 'PENDING';
    reason: string;
    key1: { passed: boolean; reason: string };
    key2: { approved: boolean; reason: string };
    notes: string;
  };
}
