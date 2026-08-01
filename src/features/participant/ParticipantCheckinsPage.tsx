import { useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { Checkin } from '../../lib/types';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';

export function ParticipantCheckinsPage() {
  const { data: checkins, loading, error, reload } = useApiResource<Checkin[]>('/checkins');
  const [active, setActive] = useState<Checkin | null>(null);
  const [form, setForm] = useState({ revenue_band: '', jobs_created: '', funding_raised: '', challenges: '', support_needed: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submitResponse() {
    if (!active) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.post(`/checkins/${active.id}/respond`, { payload: form });
      setActive(null);
      setForm({ revenue_band: '', jobs_created: '', funding_raised: '', challenges: '', support_needed: '' });
      await reload();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Could not submit response.');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<Checkin>[] = [
    { key: 'subject', header: 'Subject', render: (c) => c.subject },
    { key: 'message', header: 'Message', render: (c) => c.message },
    { key: 'due_at', header: 'Due', render: (c) => (c.due_at ? new Date(c.due_at).toLocaleDateString() : '—') },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'action',
      header: '',
      render: (c) =>
        c.status !== 'responded' ? (
          <button className="btn btn-sm" onClick={() => setActive(c)}>
            Respond
          </button>
        ) : (
          <span className="form-hint">Submitted</span>
        ),
    },
  ];

  if (loading) return <div className="page-loading">Loading check-ins…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Check-ins</h1>
      <DataTable columns={columns} rows={checkins ?? []} emptyMessage="No check-ins yet." />

      {active && (
        <Modal title={active.subject} onClose={() => setActive(null)}>
          <p>{active.message}</p>
          {submitError && <div className="banner-error">{submitError}</div>}
          <FormField label="Revenue band">
            {(id) => (
              <select
                id={id}
                value={form.revenue_band}
                onChange={(e) => setForm({ ...form, revenue_band: e.target.value })}
              >
                <option value="">Select…</option>
                <option value="0-10k">$0–10k</option>
                <option value="10k-50k">$10k–50k</option>
                <option value="50k-100k">$50k–100k</option>
                <option value="100k+">$100k+</option>
              </select>
            )}
          </FormField>
          <FormField label="Jobs created this period">
            {(id) => (
              <input
                id={id}
                type="number"
                min={0}
                value={form.jobs_created}
                onChange={(e) => setForm({ ...form, jobs_created: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Funding raised (USD)">
            {(id) => (
              <input
                id={id}
                type="number"
                min={0}
                value={form.funding_raised}
                onChange={(e) => setForm({ ...form, funding_raised: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Challenges">
            {(id) => (
              <textarea
                id={id}
                rows={3}
                value={form.challenges}
                onChange={(e) => setForm({ ...form, challenges: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Support needed">
            {(id) => (
              <textarea
                id={id}
                rows={3}
                value={form.support_needed}
                onChange={(e) => setForm({ ...form, support_needed: e.target.value })}
              />
            )}
          </FormField>
          <div className="form-actions">
            <button className="btn" onClick={submitResponse} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit response'}
            </button>
            <button className="btn btn-secondary" onClick={() => setActive(null)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
