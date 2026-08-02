const TONE_MAP: Record<string, string> = {
  active: 'status-dot-success',
  responded: 'status-dot-success',
  sent: 'status-dot-accent',
  overdue: 'status-dot-danger',
  paused: 'status-dot-warning',
  withdrawn: 'status-dot-danger',
  graduated: 'status-dot-success',
  draft: 'status-dot-warning',
  pending: 'status-dot-warning',
  complete: 'status-dot-success',
  none: '',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE_MAP[status] ?? '';
  return <span className={`status-dot ${tone}`}>{status}</span>;
}
