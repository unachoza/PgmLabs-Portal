import { useApiResource } from '../../lib/useApi';
import type { FunderUpdate } from '../../lib/types';
import { StatusBadge } from '../../components/Badge';

export function FunderUpdatesPage() {
  const { data: updates, loading, error } = useApiResource<FunderUpdate[]>('/funder-updates');

  if (loading) return <div className="page-loading">Loading updates…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Program Updates</h1>
      {(updates ?? []).length === 0 && <div className="empty-state">No updates yet.</div>}
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {(updates ?? []).map((u) => (
          <li key={u.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{u.title}</strong>
              <StatusBadge status={u.follow_up_status} />
            </div>
            <p style={{ marginTop: 'var(--space-2)' }}>{u.summary}</p>
            <span className="form-hint">{new Date(u.sent_at).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
