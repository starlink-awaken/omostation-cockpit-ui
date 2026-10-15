/**
 * React Query hooks for ComputeView.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch, apiPost } from '../api/client';
import type { ComputeStatus, StrictComputeRound, StrictComputeRequest, StrictComputeOutcome } from './computeViewTypes';

export function useComputeStatus() {
  return useQuery({
    queryKey: ['compute-status'],
    queryFn: async () => {
      const response = await apiFetch<ComputeStatus>('/api/compute/status');
      if (!response.ok) {
        throw new Error(response.error || 'Failed to fetch compute status');
      }
      return response.data;
    },
    staleTime: 6000,
    refetchInterval: 6000,
    retry: 3,
  });
}

export function isFullLocalModelId(model: string): boolean {
  return /^ENG-(?:OMLX|LMSTUDIO|OLLAMA)-[^/\s]+\/.+$/u.test(model)
    && !Array.from(model).some(char => char.codePointAt(0)! <= 32 || char.codePointAt(0) === 127)
    && model.split('/').every(part => part !== '' && part !== '.' && part !== '..');
}

export function buildStrictPrompt(rounds: StrictComputeRound[], model: string, input: string): string {
  if (rounds.length >= 10) throw new Error('已达10次尝试，请开始新会话；不会自动删除历史。');
  if (rounds.some(round => round.model !== model || round.status === 'unknown' || round.status === 'pending')) {
    throw new Error('模型已改变或上次结果未知，请开始新会话。');
  }
  if (!input.trim()) throw new Error('请输入本次问题。');
  const conversation = rounds.filter(round => round.status === 'success').flatMap(round => [
    { role: 'user', content: round.input }, { role: 'assistant', content: round.output ?? '' },
  ]);
  conversation.push({ role: 'user', content: input });
  const prompt = JSON.stringify({ conversation });
  if (Array.from(prompt).length > 4000) throw new Error('完整上下文超过4000字符，请清空并开始新会话；不会截断或压缩历史。');
  return prompt;
}

// Plain request outside React Query's mutation cache; no credential/session store.
export async function generateStrict(
  request: StrictComputeRequest, credential: string, signal: AbortSignal,
): Promise<StrictComputeOutcome> {
  const origin = globalThis.location;
  if (!origin || origin.protocol !== 'http:' || origin.port !== '8090'
    || !['127.0.0.1', '[::1]'].includes(origin.hostname)) {
    return { status: 'rejected', notice: '仅允许当前本机同源8090页面发送。' };
  }
  if (signal.aborted) return { status: 'rejected', notice: '请求尚未发送，已取消。' };
  if (!credential || /[\r\n]/u.test(credential) || !isFullLocalModelId(request.model)
    || request.strict_model !== true || !request.prompt.trim() || Array.from(request.prompt).length > 4000
    || !Number.isInteger(request.max_tokens) || request.max_tokens < 1 || request.max_tokens > 512
    || !Number.isFinite(request.timeout) || request.timeout <= 0 || request.timeout > 30) {
    return { status: 'rejected', notice: '模型、凭据或预算不符合本次发送要求。' };
  }
  const response = await apiPost<{ status?: string; content?: string; model?: string }>(
    '/api/governance/compute/generate-strict', request,
    { headers: { Authorization: `Bearer ${credential}` }, timeout: (request.timeout + 4) * 1000, signal },
  );
  if (!response.ok) {
    const code = /^HTTP (\d{3}):/u.exec(response.error ?? '')?.[1];
    const rejected = code !== undefined && ['400', '401', '403', '404', '413', '422', '429'].includes(code);
    const reason = code === '401' || code === '403' ? '需要有效的专用算力凭据及权限。'
      : code === '404' ? '当前服务不支持此入口。' : code === '429' ? '算力忙或已达限额；未自动重试。' : '请求未完成。';
    return { status: rejected ? 'rejected' : 'unknown', notice: `${code ? `HTTP ${code}：` : ''}${reason}${rejected ? '未形成对话回复。' : '结果未知，请开始新会话；取消不代表模型已停止。'}` };
  }
  const data = response.data;
  if (data?.status !== 'success' || typeof data.content !== 'string' || !data.content.trim()
    || data.model !== request.model || data.content.includes(credential)) {
    return { status: 'unknown', notice: '回复未通过完整模型或安全校验，结果未知，请开始新会话。' };
  }
  return { status: 'success', content: data.content };
}

export function useToggleCircuitBreaker() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (broken: boolean) => {
      const response = await apiPost('/api/omos/circuit-break', { broken });
      if (!response.ok) {
        throw new Error(response.error || 'Failed to toggle circuit breaker');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compute-status'] });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (budget: number) => {
      const response = await apiPost('/api/omos/budget', { budget });
      if (!response.ok) {
        throw new Error(response.error || 'Failed to update budget');
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compute-status'] });
    },
  });
}
