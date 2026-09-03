import { apiFetch, apiPost } from '../../api/client';
import type { WorkCaseListResponse } from './types';

export function listActiveWorkCases() {
  return apiFetch<WorkCaseListResponse>('/api/work-cases?scope=active');
}

export function createWorkCaseDraft(payload: { case_id: string; title: string; source_ref: string }) {
  return apiPost<{ id: string; status: string }>('/api/work-cases/drafts', payload);
}
