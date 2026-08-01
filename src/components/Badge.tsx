const TONE_MAP: Record<string, string> = {
  active: 'badge-success',
  responded: 'badge-success',
  sent: 'badge-accent',
  overdue: 'badge-danger',
  paused: 'badge-warning',
  withdrawn: 'badge-danger',
  graduated: 'badge-success',
  draft: 'badge-warning',
  pending: 'badge-warning',
  complete: 'badge-success',
  none: '',
};

export function StatusBadge({ status }: { status: string }) {
  const tone = TONE_MAP[status] ?? '';
  return <span className={`badge ${tone}`}>{status}</span>;
}
