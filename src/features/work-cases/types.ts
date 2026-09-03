export type WorkCaseStatus =
  | 'draft'
  | 'planned'
  | 'awaiting_confirmation'
  | 'executing'
  | 'reporting'
  | 'archiving'
  | 'completed'
  | 'blocked';

export type WorkCaseRisk = 'low' | 'medium' | 'high';

export interface WorkCaseSummary {
  id: string;
  title: string;
  status: WorkCaseStatus;
  due_at?: string;
  risk: WorkCaseRisk;
  next_action: string;
}

export interface WorkCaseListResponse {
  items: WorkCaseSummary[];
}
