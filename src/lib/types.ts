export type UserRole = 'participant' | 'admin' | 'funder';

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Participant = {
  id: string;
  profile_id: string;
  cohort: string;
  company_name: string | null;
  industry: string | null;
  joined_at: string;
  status: 'active' | 'graduated' | 'paused' | 'withdrawn';
  profiles?: { name: string; email: string };
};

export type CheckinStatus = 'sent' | 'responded' | 'overdue';

export type Checkin = {
  id: string;
  participant_id: string;
  subject: string;
  message: string;
  sent_by: string;
  sent_at: string;
  due_at: string | null;
  status: CheckinStatus;
};

export type ResponseTag = 'growth' | 'hiring' | 'funding' | 'risk' | 'other';

export type CheckinResponse = {
  id: string;
  checkin_id: string;
  participant_id: string;
  payload_json: Record<string, unknown>;
  submitted_at: string;
  tags?: ResponseTag[];
};

export type Survey = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  created_at: string;
  is_active: boolean;
  recurrence: 'none' | 'weekly' | 'monthly' | 'quarterly';
  questions?: SurveyQuestion[];
};

export type SurveyQuestion = {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  required: boolean;
  sort_order: number;
};

export type FunderUpdate = {
  id: string;
  title: string;
  summary: string;
  audience: string;
  sent_by: string;
  sent_at: string;
  follow_up_status: 'none' | 'pending' | 'complete';
};

export type MarketingCampaign = {
  id: string;
  title: string;
  content: string;
  audience_segment: string;
  created_by: string;
  sent_at: string | null;
  status: 'draft' | 'sent';
};

export type MetricSnapshot = {
  id: string;
  cohort: string | null;
  period_start: string | null;
  period_end: string | null;
  metric_key: string;
  metric_value: number;
  captured_at: string;
};
