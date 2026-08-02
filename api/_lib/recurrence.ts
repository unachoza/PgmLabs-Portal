// Rolling-window resubmission gating for recurring surveys. Calendar-aligned
// periods (e.g. "the current month") would need a scheduler to reset
// eligibility; a rolling window from the last submission is simpler and
// doesn't require one.
const RECURRENCE_WINDOW_DAYS: Record<string, number | null> = {
  none: null,
  weekly: 7,
  monthly: 30,
  quarterly: 91,
};

/**
 * Returns the ISO timestamp at which the participant may resubmit, or null
 * if there's no prior submission to gate against. For `recurrence: 'none'`
 * the survey can never be resubmitted, so this returns a far-future date.
 */
export function nextEligibleSubmissionAt(recurrence: string, lastSubmittedAt: string): string {
  const windowDays = RECURRENCE_WINDOW_DAYS[recurrence];
  if (windowDays === null || windowDays === undefined) {
    return new Date('9999-12-31T00:00:00.000Z').toISOString();
  }
  return new Date(new Date(lastSubmittedAt).getTime() + windowDays * 24 * 60 * 60 * 1000).toISOString();
}
