import { useApiResource } from '../../lib/useApi';
import type { ProgramEvent, ProgramKpi } from '../../lib/types';
import { KpiCard } from '../../components/Card';

function EventCard({ event }: { event: ProgramEvent }) {
  return (
    <div className="card">
      <div className="card-title-row">
        <h3 style={{ margin: 0 }}>{event.title}</h3>
        <span className="form-hint">{new Date(event.event_date).toLocaleDateString()}</span>
      </div>
      <p className="form-hint">
        {[event.cohort, event.location].filter(Boolean).join(' · ') || null}
      </p>
      {event.description && <p>{event.description}</p>}
      {event.kpis && event.kpis.length > 0 && (
        <div className="card-grid" style={{ marginTop: 'var(--space-4)' }}>
          {event.kpis.map((kpi) => (
            <KpiCard key={kpi.id} title={kpi.label} value={kpi.value} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FunderProgramsPage() {
  const { data: events, loading: eventsLoading, error: eventsError } = useApiResource<ProgramEvent[]>('/program-events');
  const {
    data: resourceCenterKpis,
    loading: kpisLoading,
    error: kpisError,
  } = useApiResource<ProgramKpi[]>('/program-kpis?panel=resource_center_activity');

  if (eventsLoading || kpisLoading) return <div className="page-loading">Loading programs…</div>;
  if (eventsError) return <div className="banner-error">{eventsError}</div>;
  if (kpisError) return <div className="banner-error">{kpisError}</div>;

  const upcoming = (events ?? []).filter((e) => e.event_type === 'upcoming').sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = (events ?? []).filter((e) => e.event_type === 'past').sort((a, b) => b.event_date.localeCompare(a.event_date));
  const periodLabel = resourceCenterKpis?.[0]?.period_label ?? null;

  return (
    <div>
      <h1>Programs</h1>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Upcoming Events</h2>
        {upcoming.length === 0 ? (
          <div className="empty-state">No upcoming events scheduled yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {upcoming.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Past Events &amp; Achievements</h2>
        {past.length === 0 ? (
          <div className="empty-state">No past events recorded yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {past.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2>Business Resource Center Activity</h2>
        {periodLabel && <p className="form-hint">{periodLabel}</p>}
        {(resourceCenterKpis ?? []).length === 0 ? (
          <div className="empty-state">No resource center activity recorded yet.</div>
        ) : (
          <div className="card-grid">
            {(resourceCenterKpis ?? []).map((kpi) => (
              <KpiCard key={kpi.id} title={kpi.label} value={kpi.value} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
