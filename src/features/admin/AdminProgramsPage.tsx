import { useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { ProgramEvent, ProgramKpi } from '../../lib/types';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';

const EMPTY_EVENT_FORM = {
  title: '',
  description: '',
  event_type: 'upcoming' as ProgramEvent['event_type'],
  event_date: '',
  cohort: '',
  location: '',
};

function AchievementsEditor({ event, onChanged }: { event: ProgramEvent; onChanged: () => void }) {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  async function addKpi() {
    if (!label.trim() || !value.trim()) return;
    setSaving(true);
    try {
      await api.post('/program-kpis', {
        panel: 'cohort_achievements',
        event_id: event.id,
        label,
        value,
        sort_order: event.kpis?.length ?? 0,
      });
      setLabel('');
      setValue('');
      await onChanged();
    } finally {
      setSaving(false);
    }
  }

  async function removeKpi(kpi: ProgramKpi) {
    await api.delete(`/program-kpis/${kpi.id}`);
    await onChanged();
  }

  return (
    <div style={{ marginTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
      <strong style={{ fontSize: 14 }}>Achievements</strong>
      {(event.kpis ?? []).length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 'var(--space-2) 0' }}>
          {(event.kpis ?? []).map((kpi) => (
            <li key={kpi.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span>
                {kpi.label}: <strong>{kpi.value}</strong>
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => removeKpi(kpi)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginTop: 'var(--space-2)' }}>
        <input aria-label="Achievement label" placeholder="Label, e.g. Cohort Companies" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input aria-label="Achievement value" placeholder="Value, e.g. 10 or 30%" value={value} onChange={(e) => setValue(e.target.value)} style={{ maxWidth: 140 }} />
        <button className="btn btn-secondary btn-sm" onClick={addKpi} disabled={saving || !label.trim() || !value.trim()}>
          Add
        </button>
      </div>
    </div>
  );
}

function ResourceCenterKpiEditor({
  kpis,
  reload,
}: {
  kpis: ProgramKpi[];
  reload: () => Promise<void>;
}) {
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [periodLabel, setPeriodLabel] = useState(kpis[0]?.period_label ?? '');
  const [saving, setSaving] = useState(false);

  async function addKpi() {
    if (!label.trim() || !value.trim()) return;
    setSaving(true);
    try {
      await api.post('/program-kpis', {
        panel: 'resource_center_activity',
        label,
        value,
        period_label: periodLabel || undefined,
        sort_order: kpis.length,
      });
      setLabel('');
      setValue('');
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function removeKpi(kpi: ProgramKpi) {
    await api.delete(`/program-kpis/${kpi.id}`);
    await reload();
  }

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Resource Center Activity</h3>
      <p className="form-hint">Period-wide activity stats, not tied to a specific cohort (e.g. "May - Dec 2025").</p>
      {kpis.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {kpis.map((kpi) => (
            <li key={kpi.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
              <span>
                {kpi.label}: <strong>{kpi.value}</strong> {kpi.period_label && <span className="form-hint">({kpi.period_label})</span>}
              </span>
              <button className="btn btn-secondary btn-sm" onClick={() => removeKpi(kpi)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
        <input aria-label="KPI label" placeholder="Label, e.g. Unique Visitors" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input aria-label="KPI value" placeholder="Value, e.g. 132 or 26%" value={value} onChange={(e) => setValue(e.target.value)} style={{ maxWidth: 140 }} />
        <input aria-label="Period label" placeholder="Period, e.g. May - Dec 2025" value={periodLabel} onChange={(e) => setPeriodLabel(e.target.value)} style={{ maxWidth: 200 }} />
        <button className="btn btn-secondary btn-sm" onClick={addKpi} disabled={saving || !label.trim() || !value.trim()}>
          Add
        </button>
      </div>
    </div>
  );
}

export function AdminProgramsPage() {
  const { data: events, loading: eventsLoading, error: eventsError, reload: reloadEvents } = useApiResource<ProgramEvent[]>('/program-events');
  const {
    data: resourceCenterKpis,
    loading: kpisLoading,
    error: kpisError,
    reload: reloadKpis,
  } = useApiResource<ProgramKpi[]>('/program-kpis?panel=resource_center_activity');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_EVENT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_EVENT_FORM);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(event: ProgramEvent) {
    setEditingId(event.id);
    setForm({
      title: event.title,
      description: event.description ?? '',
      event_type: event.event_type,
      event_date: event.event_date.slice(0, 10),
      cohort: event.cohort ?? '',
      location: event.location ?? '',
    });
    setFormError(null);
    setShowForm(true);
  }

  async function save() {
    setSubmitting(true);
    setFormError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        event_type: form.event_type,
        event_date: form.event_date,
        cohort: form.cohort || undefined,
        location: form.location || undefined,
      };
      if (editingId) {
        await api.patch(`/program-events/${editingId}`, payload);
      } else {
        await api.post('/program-events', payload);
      }
      setShowForm(false);
      await reloadEvents();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not save event.');
    } finally {
      setSubmitting(false);
    }
  }

  async function removeEvent(event: ProgramEvent) {
    if (!confirm(`Delete "${event.title}"? This also removes its achievement stats.`)) return;
    await api.delete(`/program-events/${event.id}`);
    await reloadEvents();
  }

  if (eventsLoading || kpisLoading) return <div className="page-loading">Loading programs…</div>;
  if (eventsError) return <div className="banner-error">{eventsError}</div>;
  if (kpisError) return <div className="banner-error">{kpisError}</div>;

  const upcoming = (events ?? []).filter((e) => e.event_type === 'upcoming').sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = (events ?? []).filter((e) => e.event_type === 'past').sort((a, b) => b.event_date.localeCompare(a.event_date));

  return (
    <div>
      <h1>Programs</h1>
      <p className="form-hint">Manages what funders see on their Programs page — upcoming events, past events, and cohort/resource center stats.</p>
      <div className="toolbar">
        <button className="btn" onClick={openCreate}>
          Add event
        </button>
      </div>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Upcoming Events</h2>
        {upcoming.length === 0 && <div className="empty-state">No upcoming events yet.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {upcoming.map((event) => (
            <div className="card" key={event.id}>
              <div className="card-title-row">
                <h3 style={{ margin: 0 }}>{event.title}</h3>
                <span className="form-hint">{new Date(event.event_date).toLocaleDateString()}</span>
              </div>
              <p className="form-hint">{[event.cohort, event.location].filter(Boolean).join(' · ')}</p>
              {event.description && <p>{event.description}</p>}
              <div className="form-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(event)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => removeEvent(event)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Past Events &amp; Achievements</h2>
        {past.length === 0 && <div className="empty-state">No past events yet.</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {past.map((event) => (
            <div className="card" key={event.id}>
              <div className="card-title-row">
                <h3 style={{ margin: 0 }}>{event.title}</h3>
                <span className="form-hint">{new Date(event.event_date).toLocaleDateString()}</span>
              </div>
              <p className="form-hint">{[event.cohort, event.location].filter(Boolean).join(' · ')}</p>
              {event.description && <p>{event.description}</p>}
              <div className="form-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(event)}>
                  Edit
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => removeEvent(event)}>
                  Delete
                </button>
              </div>
              <AchievementsEditor event={event} onChanged={reloadEvents} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <ResourceCenterKpiEditor kpis={resourceCenterKpis ?? []} reload={reloadKpis} />
      </section>

      {showForm && (
        <Modal title={editingId ? 'Edit event' : 'Add event'} onClose={() => setShowForm(false)}>
          {formError && <div className="banner-error">{formError}</div>}
          <FormField label="Title" required>
            {(id) => <input id={id} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}
          </FormField>
          <FormField label="Type" required>
            {(id) => (
              <select
                id={id}
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value as ProgramEvent['event_type'] })}
              >
                <option value="upcoming">Upcoming</option>
                <option value="past">Past</option>
              </select>
            )}
          </FormField>
          <FormField label="Date" required>
            {(id) => (
              <input id={id} type="date" required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
            )}
          </FormField>
          <FormField label="Cohort" hint="e.g. Cohort 10">
            {(id) => <input id={id} value={form.cohort} onChange={(e) => setForm({ ...form, cohort: e.target.value })} />}
          </FormField>
          <FormField label="Location">
            {(id) => <input id={id} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />}
          </FormField>
          <FormField label="Description">
            {(id) => (
              <textarea id={id} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            )}
          </FormField>
          <div className="form-actions">
            <button className="btn" onClick={save} disabled={submitting || !form.title || !form.event_date}>
              {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add event'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
