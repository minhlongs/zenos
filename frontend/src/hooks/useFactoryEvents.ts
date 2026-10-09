'use client';

import { useState, useEffect, useRef } from 'react';
import { FactoryEvent, GoalLifecycleState } from '../types/factory';

const BASE_URL = process.env.NEXT_PUBLIC_ZENOS_URL || 'http://127.0.0.1:4000';

interface UseFactoryEventsReturn {
  connected: boolean;
  logs: string[];
  lastGoalState: { goalId: string; state: GoalLifecycleState } | null;
  circuitBreaker: boolean;
  clearLogs: () => void;
}

export function useFactoryEvents(): UseFactoryEventsReturn {
  const [connected, setConnected] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [lastGoalState, setLastGoalState] = useState<{ goalId: string; state: GoalLifecycleState } | null>(null);
  const [circuitBreaker, setCircuitBreaker] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let active = true;

    function connect() {
      if (!active) return;
      const es = new EventSource(`${BASE_URL}/v1/factory/events`);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (active) setConnected(true);
      };

      es.onmessage = (event) => {
        if (!active) return;
        try {
          const parsed = JSON.parse(event.data) as FactoryEvent;
          if (parsed.type === 'cook_log' && parsed.payload.message) {
            setLogs((prev) => [...prev.slice(-99), `[${parsed.timestamp}] ${parsed.payload.message}`]);
          } else if (parsed.type === 'goal_state' && parsed.payload.goalId && parsed.payload.state) {
            setLastGoalState({
              goalId: parsed.payload.goalId,
              state: parsed.payload.state
            });
          } else if (parsed.type === 'circuit_breaker') {
            setCircuitBreaker(true);
          }
        } catch {
          // Ignore unparseable frames
        }
      };

      es.onerror = () => {
        if (!active) return;
        setConnected(false);
        es.close();
        // Exponential reconnect backoff
        setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      active = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const clearLogs = () => setLogs([]);

  return {
    connected,
    logs,
    lastGoalState,
    circuitBreaker,
    clearLogs
  };
}
