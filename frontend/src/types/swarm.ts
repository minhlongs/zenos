export type SwarmRole = 'ARCHITECT' | 'CODER' | 'VERIFIER' | 'AUDITOR';

export type ArtifactType = 'SPEC' | 'CODE_DIFF' | 'TEST_OUTPUT' | 'AUDIT_REPORT';

export type SwarmSessionStatus =
  | 'PLANNING'
  | 'CODING'
  | 'VERIFYING'
  | 'AUDITING'
  | 'CONSENSUS_REACHED'
  | 'FAILED';

export interface SwarmArtifact {
  id: string;
  sessionId?: string;
  session_id?: string;
  role: SwarmRole | string;
  artifactType: ArtifactType | string;
  artifact_type?: string;
  content: string;
  round?: number;
  createdAt?: string;
  created_at?: string;
}

export interface SwarmConsensus {
  sessionId?: string;
  session_id?: string;
  verifierPass: boolean | number;
  verifier_pass?: boolean | number;
  auditorPass: boolean | number;
  auditor_pass?: boolean | number;
  verdict: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  notes?: string;
  updatedAt?: string;
  updated_at?: string;
}

export interface SwarmSession {
  id: string;
  objective: string;
  status: SwarmSessionStatus | string;
  currentRole?: SwarmRole | string;
  current_role?: string;
  currentRound?: number;
  current_round?: number;
  maxRounds?: number;
  max_rounds?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  artifacts?: SwarmArtifact[];
  consensus?: SwarmConsensus | null;
}

export interface SwarmRunOptions {
  objective: string;
  maxRounds?: number;
  workspaceDir?: string;
}

export interface SwarmRunResponse {
  success: boolean;
  sessionId?: string;
  session?: SwarmSession;
  error?: string;
}

export interface SwarmEvent {
  type:
    | 'swarm_turn_start'
    | 'swarm_artifact_posted'
    | 'swarm_consensus_eval'
    | 'swarm_session_complete'
    | string;
  sessionId?: string;
  role?: SwarmRole | string;
  artifact?: SwarmArtifact;
  consensus?: SwarmConsensus;
  round?: number;
  status?: string;
  timestamp?: string;
  payload?: Record<string, unknown>;
}
