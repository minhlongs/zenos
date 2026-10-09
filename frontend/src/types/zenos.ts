export interface LatencyMetrics {
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface ModelUsageStats {
  requests: number;
  errors: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface TelemetrySummary {
  uptimeSeconds: number;
  totalRequests: number;
  activeRequests: number;
  statusCodes: Record<string, number>;
  errorRate: number;
  latency: LatencyMetrics;
  models: Record<string, ModelUsageStats>;
}

export interface ApprovalRecord {
  id: string;
  token: string;
  action: string;
  command: string | null;
  context: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
}

export interface TelemetryEvent {
  type: string;
  id?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  model?: string;
  timestamp: string;
  error?: string | null;
}
