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
  plan_confirmed: boolean;
  valid_submission_count: number;
  submission_version_count: number;
}

export interface WorkCaseListResponse {
  items: WorkCaseSummary[];
}

export interface WorkCaseExternalAction {
  id: string;
  status: 'pending';
  action_type: string;
  recipient_count: number;
  attachment_count: number;
  action_snapshot_digest: string;
  created_at: string;
}

export interface WorkCaseExternalActionListResponse {
  items: WorkCaseExternalAction[];
}
