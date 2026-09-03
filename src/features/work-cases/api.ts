import { apiFetch, apiPost } from '../../api/client';
import type { WorkCaseExternalActionListResponse, WorkCaseListResponse } from './types';

export function listActiveWorkCases() {
  return apiFetch<WorkCaseListResponse>('/api/work-cases?scope=active');
}

export function createWorkCaseDraft(payload: { case_id: string; title: string; source_ref: string }) {
  return apiPost<{ id: string; status: string }>('/api/work-cases/drafts', payload);
}

export function requestWorkCasePlan(caseId: string, planDigest: string) {
  return apiPost<{ id: string; status: string }>(`/api/work-cases/${caseId}/plan-requests`, { plan_digest: planDigest });
}

export function recordWorkCaseSubmission(caseId: string, payload: { unit_id: string; digest: string; valid: boolean }) {
  return apiPost<{ id: string; status: string }>(`/api/work-cases/${caseId}/submissions`, payload);
}

export function listWorkCaseExternalActions(caseId: string) {
  return apiFetch<WorkCaseExternalActionListResponse>(`/api/work-cases/${caseId}/external-actions`);
}
