/** Console API hooks — hand-written, not using factory.ts. */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../client';
import { CONSOLE_BOS_ENDPOINTS, CONSOLE_HARNESS_ENDPOINTS, CONSOLE_MOF_ENDPOINTS } from '../console/endpoints';
import type {
  BosInvokeRequest,
  BosInvokeResult,
  ConsoleEnvelope,
  HarnessSseEvent,
  HarnessRun,
  MofAuditResult,
  MofViolation,
  StreamPhase,
} from './types';

// ── BOS Queries ──────────────────────────────────────────────

export function useBosCatalog(domain?: string) {
  return useQuery({
    queryKey: ['console', 'bos', 'catalog', domain],
    queryFn: async () => {
      const res = await apiFetch<ConsoleEnvelope<{ total: number; services: unknown[] }>>(
        CONSOLE_BOS_ENDPOINTS.catalog(domain),
      );
      return res.data?.data ?? { total: 0, services: [] };
    },
    staleTime: 60_000,
  });
}

export function useBosSchema(uri: string) {
  return useQuery({
    queryKey: ['console', 'bos', 'schema', uri],
    queryFn: async () => {
      const res = await apiFetch<ConsoleEnvelope<unknown>>(CONSOLE_BOS_ENDPOINTS.schema(uri));
      return res.data?.data ?? null;
    },
    enabled: !!uri,
    staleTime: 300_000,
  });
}

export function useBosHistory(prefix?: string) {
  return useQuery({
    queryKey: ['console', 'bos', 'history', prefix],
    queryFn: async () => {
      const res = await apiFetch<ConsoleEnvelope<unknown>>(CONSOLE_BOS_ENDPOINTS.history(prefix));
      return res.data?.data ?? null;
    },
    staleTime: 30_000,
  });
}

// ── BOS Mutation ─────────────────────────────────────────────

export function useBosInvoke() {
  return useMutation({
    mutationFn: async ({
      request,
      confirmToken,
    }: {
      request: BosInvokeRequest;
      confirmToken?: string;
    }) => {
      const headers: Record<string, string> = {};
      if (confirmToken) headers['X-Console-Confirm'] = confirmToken;
      const res = await apiPost<ConsoleEnvelope<BosInvokeResult>>(
        CONSOLE_BOS_ENDPOINTS.invoke,
        request,
        { headers, timeout: 130_000 },
      );
      if (res.error) throw new Error(res.error);
      if (!res.data?.ok) {
        throw new Error(res.data?.error ?? 'Invoke failed');
      }
      return res.data.data;
    },
  });
}

// ── MOF Queries ──────────────────────────────────────────────

export function useMofRules() {
  return useQuery({
    queryKey: ['console', 'mof', 'rules'],
    queryFn: async () => {
      const res = await apiFetch<ConsoleEnvelope<unknown>>(CONSOLE_MOF_ENDPOINTS.rules);
      return res.data?.data ?? null;
    },
    staleTime: 300_000,
  });
}

// ── MOF Mutations ────────────────────────────────────────────

export function useMofAudit() {
  return useMutation({
    mutationFn: async (params?: { family?: string; max_rules?: number }) => {
      const res = await apiPost<ConsoleEnvelope<MofAuditResult>>(
        CONSOLE_MOF_ENDPOINTS.audit,
        params ?? {},
        { timeout: 300_000 },
      );
      if (res.error) throw new Error(res.error);
      if (!res.data?.ok) {
        throw new Error(res.data?.error ?? 'Audit failed');
      }
      return res.data.data;
    },
  });
}

export function useMofEvaluate() {
  return useMutation({
    mutationFn: async (params: {
      constraint_id: string;
      target: string;
      target_kind: string;
      caller_layer?: string;
      caller_domain?: string;
    }) => {
      const res = await apiPost<ConsoleEnvelope<{ passed: boolean; violations: MofViolation[]; elapsed_ms: number }>>(
        CONSOLE_MOF_ENDPOINTS.evaluate,
        params,
      );
      if (res.error) throw new Error(res.error);
      if (!res.data?.ok) throw new Error(res.data?.error ?? 'Evaluate failed');
      return res.data.data;
    },
  });
}

// ── Harness Queries ──────────────────────────────────────────

export function useHarnessRuns() {
  return useQuery({
    queryKey: ['console', 'harness', 'runs'],
    queryFn: async () => {
      const res = await apiFetch<ConsoleEnvelope<{ runs: HarnessRun[] }>>(CONSOLE_HARNESS_ENDPOINTS.runs);
      return res.data?.data?.runs ?? [];
    },
    refetchInterval: 15_000,
  });
}

// ── Harness Mutation ─────────────────────────────────────────

export function useHarnessSubmit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (spec: {
      bet_id: string;
      profile: string;
      objective: string;
      worktree_path: string;
      dry_run?: boolean;
    }) => {
      const res = await apiPost<ConsoleEnvelope<HarnessRun>>(
        CONSOLE_HARNESS_ENDPOINTS.runs,
        spec,
      );
      if (res.error) throw new Error(res.error);
      if (!res.data?.ok) throw new Error(res.data?.error ?? 'Submit failed');
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['console', 'harness', 'runs'] });
    },
  });
}

// ── Harness SSE Stream ───────────────────────────────────────

export function useHarnessEventStream(runId: string | null) {
  const [events, setEvents] = useState<HarnessSseEvent[]>([]);
  const [phase, setPhase] = useState<StreamPhase>('idle');
  const [lastSeqState, setLastSeqState] = useState(-1);
  const lastSeq = useRef(-1);
  const attempts = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!runId) {
      setEvents([]);
      setPhase('idle');
      return;
    }

    let cancelled = false;

    const connect = async () => {
      setPhase(attempts.current === 0 ? 'connecting' : 'reconnecting');
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const headers: Record<string, string> = { Accept: 'text/event-stream' };
        if (lastSeq.current >= 0) {
          headers['Last-Event-ID'] = String(lastSeq.current);
        }

        const res = await fetch(CONSOLE_HARNESS_ENDPOINTS.runEvents(runId), {
          signal: ctrl.signal,
          headers,
        });

        if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let completed = false;

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const frames = buffer.split('\n\n');
          buffer = frames.pop() ?? '';

          for (const frame of frames) {
            if (!frame.trim()) continue;
            if (frame.startsWith(':')) continue; // keepalive

            let event = '';
            let data = '';
            for (const line of frame.split('\n')) {
              if (line.startsWith('event: ')) event = line.slice(7);
              else if (line.startsWith('data: ')) data = line.slice(6);
            }

            if (!data) continue;
            try {
              const parsed = JSON.parse(data) as HarnessSseEvent;
              setEvents((prev) => [...prev, parsed]);
              if (parsed.seq != null) {
                lastSeq.current = parsed.seq;
                setLastSeqState(parsed.seq);
              }
              if (event === 'run_complete') completed = true;
            } catch {
              // skip malformed frames
            }
          }

          if (completed) {
            setPhase('closed');
            attempts.current = 0;
            return;
          }
        }

        if (!cancelled) {
          setPhase('closed');
          attempts.current = 0;
        }
      } catch {
        if (cancelled || ctrl.signal.aborted) return;
        setPhase('reconnecting');
        if (attempts.current < 5) {
          attempts.current += 1;
          const delay = Math.min(1000 * 2 ** attempts.current, 30_000);
          setTimeout(() => {
            if (!cancelled) connect();
          }, delay);
        } else {
          setPhase('closed');
        }
      }
    };

    void connect();
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [runId]);

  const reset = useCallback(() => {
    setEvents([]);
    setLastSeqState(-1);
  }, []);

  return { events, phase, lastSeq: lastSeqState, reset };
}
