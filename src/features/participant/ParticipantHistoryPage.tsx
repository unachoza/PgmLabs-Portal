import { useApiResource } from '../../lib/useApi';
import type { Checkin } from '../../lib/types';
import { StatusBadge } from '../../components/Badge';

export function ParticipantHistoryPage() {
  const { data: checkins, loading, error } = useApiResource<Checkin[]>('/checkins');

  if (loading) return <div className="page-loading">Loading history…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Communication History</h1>
      {(checkins ?? []).length === 0 && <div className="empty-state">No messages yet.</div>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {(checkins ?? []).map((c) => (
          <li key={c.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{c.subject}</strong>
              <StatusBadge status={c.status} />
            </div>
            <p style={{ marginTop: 'var(--space-2)' }}>{c.message}</p>
            <span className="form-hint">Sent {new Date(c.sent_at).toLocaleString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
