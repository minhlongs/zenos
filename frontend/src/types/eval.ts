export interface EvalBenchmarkMeta {
  id: string;
  title: string;
  category: string;
  task: string;
  targetFile: string;
}

export interface EvalCaseResult {
  id?: string;
  run_id?: string;
  benchmark_id: string;
  initial_pass: boolean | number;
  final_pass: boolean | number;
  repair_attempts: number;
  duration_ms: number;
  error?: string | null;
  critique_history?: string | null;
}

export interface EvalRunSummary {
  id: string;
  suite_id: string;
  total_cases: number;
  passed_cases: number;
  pass_at_1: number;
  recovery_rate: number;
  total_duration_ms: number;
  created_at: string;
  cases?: EvalCaseResult[];
}

export interface EvalEventMessage {
  type: 'eval_start' | 'eval_case_start' | 'eval_case_complete' | 'eval_summary' | 'eval_error';
  runId?: string;
  benchmarkId?: string;
  caseResult?: EvalCaseResult;
  summary?: EvalRunSummary;
  total?: number;
  error?: string;
}
