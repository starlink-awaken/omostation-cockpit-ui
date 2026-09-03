import { apiFetch } from '../../api/client';
import type { WorkCaseListResponse } from './types';

export function listActiveWorkCases() {
  return apiFetch<WorkCaseListResponse>('/api/work-cases?scope=active');
}
