// frontend/src/types/brainstorm.ts
'use strict';

export type DebatePersona = 'ADVOCATE' | 'ADVERSARY' | 'SYNTHESIZER';
export type AriTier = 'SAFE' | 'CAUTION' | 'CRITICAL';

export interface DebateTurn {
  persona: DebatePersona;
  role: string;
  argument: string;
  riskIdentified?: boolean;
  invariantWarnings?: string[];
  candidateStrategies?: BrainstormStrategy[];
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
  status: 'active' | 'completed';
  turns: DebateTurn[];
  strategies: BrainstormStrategy[];
  recommendedStrategy: BrainstormStrategy | null;
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
