export interface ZenPhase {
  name: string;
  action: string;
  files: string[];
}

export interface ZenModelRoute {
  provider: 'local' | 'cloud';
  model: string;
  targetConcurrency: number;
}

export interface ZenPlan {
  goal: string;
  complexityScore: number;
  modelRoute: ZenModelRoute;
  strategy: 'TDD_STRICT' | 'RAPID_PROTOTYPE' | 'DIRECT_EXECUTION';
  phases: ZenPhase[];
  files: string[];
  tests: string[];
}

export interface LocAuditReport {
  passed: boolean;
  files: Array<{ file: string; loc: number; ok: boolean }>;
}

export interface CookCycleResult {
  cycle: number;
  exitCode: number;
  output: string;
  locAudit: LocAuditReport;
  status: 'TESTS_PASSED' | 'TESTS_FAILED' | 'CIRCUIT_BREAKER_TRIGGERED';
  passed: boolean;
}

export type GoalLifecycleState =
  | 'IDLE'
  | 'PLANNING'
  | 'COOKING'
  | 'VERIFYING'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'ABORTED';

export interface GoalStatus {
  id: string;
  state: GoalLifecycleState;
  prompt: string;
  currentCycle?: number;
  maxCycles?: number;
  activeTest?: string;
  updatedAt: string;
  error?: string | null;
}

export interface FactoryEvent {
  type:
    | 'goal_state'
    | 'cook_log'
    | 'circuit_breaker'
    | 'heartbeat'
    | 'supervisor_heartbeat'
    | 'supervisor_reconcile'
    | 'supervisor_deadman'
    | 'supervisor_kill_all';
  timestamp: string;
  payload: {
    goalId?: string;
    state?: GoalLifecycleState;
    message?: string;
    cycle?: number;
    error?: string;
    killedCount?: number;
    recoveredTasks?: number;
  };
}

export interface SupervisorTask {
  taskId: string;
  registeredAt: string;
  lastHeartbeat: string;
  pgid?: number | null;
}

export interface SupervisorJail {
  jailId: string;
  pid: number | null;
  pgid: number | null;
  command: string;
  startedAt: string;
  timedOut: boolean;
}

export interface SupervisorStatus {
  activeTasks: SupervisorTask[];
  activeCount: number;
  lastHeartbeat: string | null;
  bootReconciledCount: number;
  activeJails: SupervisorJail[];
}
