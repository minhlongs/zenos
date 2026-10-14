// frontend/src/types/brainstorm.ts
'use strict';

export type DebatePersona =
  | 'ADVOCATE'
  | 'ADVERSARY'
  | 'CROSS_EXAMINER'
  | 'REBUTTAL'
  | 'SYNTHESIZER';
export type AriTier = 'SAFE' | 'CAUTION' | 'CRITICAL';

export interface SubmoduleSlice {
  path: string;
  estimatedLoc: number;
  responsibility: string;
}

export interface ModuleSplitBlueprint {
  originalFile: string;
  facadePath: string;
  extractedSubmodules: SubmoduleSlice[];
}

export interface CodebaseTelemetry {
  totalLines: number;
  codeLines?: number;
  branchingCount: number;
  fanIn: number;
  fanOut: number;
  detectedSeams: number;
  monolithScore: number;
  blastRadiusScore: number;
  riskLevel?: string;
}

export interface DebateTurn {
  persona: DebatePersona;
  role: string;
  argument: string;
  riskIdentified?: boolean;
  invariantWarnings?: string[];
  socraticQuestions?: string[];
  candidateStrategies?: BrainstormStrategy[];
  splitBlueprint?: ModuleSplitBlueprint;
  consensusSummary?: string;
  timestamp: string;
}

export interface BrainstormStrategy {
  id: string;
  name: string;
  description: string;
  blastRadius: number;
  complexity: number;
  invariantRisk: number;
  churnProbability: number;
  estimatedTouchedFiles: number;
  ariScore?: number;
  tier?: AriTier;
  rank?: number;
  isRecommended?: boolean;
}

export interface BrainstormSession {
  id: string;
  topic: string;
  targetFile: string;
  deep?: boolean;
  status: 'active' | 'completed';
  telemetry?: CodebaseTelemetry;
  turns: DebateTurn[];
  strategies: BrainstormStrategy[];
  recommendedStrategy: BrainstormStrategy | null;
  splitBlueprint?: ModuleSplitBlueprint;
  createdAt: string;
}

export interface ZenPlanDispatched {
  topic: string;
  strategyId: string;
  strategyName: string;
  ariScore: number;
  targetFile: string;
  steps: string[];
  createdAt: string;
}
