import { apiFetch, apiPost } from '../../api/client';
import type { WorkCaseListResponse } from './types';

export function listActiveWorkCases() {
  return apiFetch<WorkCaseListResponse>('/api/work-cases?scope=active');
}

export function createWorkCaseDraft(payload: { case_id: string; title: string; source_ref: string }) {
  return apiPost<{ id: string; status: string }>('/api/work-cases/drafts', payload);
}

export function requestWorkCasePlan(caseId: string, planDigest: string) {
  return apiPost<{ id: string; status: string }>(`/api/work-cases/${caseId}/plan-requests`, { plan_digest: planDigest });
}
