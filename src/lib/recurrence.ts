import type { Survey } from './types';

// Mirrors api/_lib/recurrence.ts — rolling window from the last submission,
// not a calendar-aligned period.
const RECURRENCE_WINDOW_DAYS: Record<string, number | null> = {
  none: null,
  weekly: 7,
  monthly: 30,
  quarterly: 91,
};

export type SurveyEligibility =
  | { status: 'open' }
  | { status: 'locked_forever' }
  | { status: 'locked_until'; availableAt: string };

export function surveyEligibility(recurrence: Survey['recurrence'], lastSubmittedAt: string | undefined): SurveyEligibility {
  if (!lastSubmittedAt) return { status: 'open' };
  if (recurrence === 'none') return { status: 'locked_forever' };

  const windowDays = RECURRENCE_WINDOW_DAYS[recurrence];
  if (!windowDays) return { status: 'open' };

  const availableAt = new Date(new Date(lastSubmittedAt).getTime() + windowDays * 24 * 60 * 60 * 1000).toISOString();
  return new Date() < new Date(availableAt) ? { status: 'locked_until', availableAt } : { status: 'open' };
}
