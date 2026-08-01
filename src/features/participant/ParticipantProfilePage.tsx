import { useApiResource } from '../../lib/useApi';
import type { Participant } from '../../lib/types';
import { StatusBadge } from '../../components/Badge';

export function ParticipantProfilePage() {
  const { data: participant, loading, error } = useApiResource<Participant>('/participants/me');

  if (loading) return <div className="page-loading">Loading your profile…</div>;
  if (error) return <div className="banner-error">{error}</div>;
  if (!participant) return null;

  return (
    <div>
      <h1>My Profile</h1>
      <div className="card" style={{ maxWidth: 480 }}>
        <dl>
          <dt className="card-title">Name</dt>
          <dd style={{ margin: '0 0 var(--space-3)' }}>{participant.profiles?.name}</dd>
          <dt className="card-title">Company</dt>
          <dd style={{ margin: '0 0 var(--space-3)' }}>{participant.company_name ?? '—'}</dd>
          <dt className="card-title">Industry</dt>
          <dd style={{ margin: '0 0 var(--space-3)' }}>{participant.industry ?? '—'}</dd>
          <dt className="card-title">Cohort</dt>
          <dd style={{ margin: '0 0 var(--space-3)' }}>{participant.cohort}</dd>
          <dt className="card-title">Status</dt>
          <dd style={{ margin: 0 }}>
            <StatusBadge status={participant.status} />
          </dd>
        </dl>
      </div>
    </div>
  );
}
