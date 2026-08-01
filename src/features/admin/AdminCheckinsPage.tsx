import { useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { Checkin, Participant } from '../../lib/types';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/Badge';
import { FormField } from '../../components/FormField';

export function AdminCheckinsPage() {
  const { data: checkins, loading, error, reload } = useApiResource<Checkin[]>('/checkins');
  const { data: participants } = useApiResource<Participant[]>('/participants');

  const [selected, setSelected] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  async function send() {
    if (selected.length === 0 || !subject || !message) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/checkins', {
        participant_ids: selected,
        subject,
        message,
        due_at: dueAt ? new Date(dueAt).toISOString() : undefined,
      });
      setSelected([]);
      setSubject('');
      setMessage('');
      setDueAt('');
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not send check-in.');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<Checkin>[] = [
    { key: 'subject', header: 'Subject', render: (c) => c.subject },
    { key: 'sent_at', header: 'Sent', render: (c) => new Date(c.sent_at).toLocaleDateString() },
    { key: 'due_at', header: 'Due', render: (c) => (c.due_at ? new Date(c.due_at).toLocaleDateString() : '—') },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
  ];

  return (
    <div>
      <h1>Check-ins</h1>

      <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
        <h2>Send a check-in</h2>
        {formError && <div className="banner-error">{formError}</div>}
        <FormField label="Recipients" hint="Select one or more participants" required>
          {() => (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', maxHeight: 160, overflowY: 'auto' }}>
              {(participants ?? []).map((p) => (
                <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggle(p.id)} />
                  {p.profiles?.name}
                </label>
              ))}
            </div>
          )}
        </FormField>
        <FormField label="Subject" required>
          {(id) => <input id={id} required value={subject} onChange={(e) => setSubject(e.target.value)} />}
        </FormField>
        <FormField label="Message" required>
          {(id) => <textarea id={id} rows={3} required value={message} onChange={(e) => setMessage(e.target.value)} />}
        </FormField>
        <FormField label="Due date">
          {(id) => <input id={id} type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />}
        </FormField>
        <button className="btn" onClick={send} disabled={submitting || selected.length === 0}>
          {submitting ? 'Sending…' : `Send to ${selected.length || ''} recipient${selected.length === 1 ? '' : 's'}`}
        </button>
      </div>

      <h2>Sent check-ins</h2>
      {loading && <div className="page-loading">Loading…</div>}
      {error && <div className="banner-error">{error}</div>}
      {!loading && !error && <DataTable columns={columns} rows={checkins ?? []} emptyMessage="No check-ins sent yet." />}
    </div>
  );
}
