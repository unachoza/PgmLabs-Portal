import { useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { FunderUpdate } from '../../lib/types';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';

export function AdminFunderUpdatesPage() {
  const { data: updates, loading, error, reload } = useApiResource<FunderUpdate[]>('/funder-updates');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', summary: '', audience: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function create() {
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/funder-updates', form);
      setShowCreate(false);
      setForm({ title: '', summary: '', audience: '' });
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not send update.');
    } finally {
      setSubmitting(false);
    }
  }

  async function markFollowUp(update: FunderUpdate, status: FunderUpdate['follow_up_status']) {
    await api.patch(`/funder-updates/${update.id}`, { follow_up_status: status });
    await reload();
  }

  const columns: Column<FunderUpdate>[] = [
    { key: 'title', header: 'Title', render: (u) => u.title },
    { key: 'audience', header: 'Audience', render: (u) => u.audience },
    { key: 'sent_at', header: 'Sent', render: (u) => new Date(u.sent_at).toLocaleDateString() },
    { key: 'status', header: 'Follow-up', render: (u) => <StatusBadge status={u.follow_up_status} /> },
    {
      key: 'action',
      header: '',
      render: (u) =>
        u.follow_up_status !== 'complete' && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => markFollowUp(u, u.follow_up_status === 'none' ? 'pending' : 'complete')}
          >
            {u.follow_up_status === 'none' ? 'Mark pending' : 'Mark complete'}
          </button>
        ),
    },
  ];

  if (loading) return <div className="page-loading">Loading funder communications…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Funder Communications</h1>
      <div className="toolbar">
        <button className="btn" onClick={() => setShowCreate(true)}>
          Send update
        </button>
      </div>
      <DataTable columns={columns} rows={updates ?? []} emptyMessage="No funder updates sent yet." />

      {showCreate && (
        <Modal title="Send funder update" onClose={() => setShowCreate(false)}>
          {formError && <div className="banner-error">{formError}</div>}
          <FormField label="Title" required>
            {(id) => <input id={id} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}
          </FormField>
          <FormField label="Audience" required hint="e.g. a funder name or 'all_funders'">
            {(id) => (
              <input id={id} required value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
            )}
          </FormField>
          <FormField label="Summary" required>
            {(id) => (
              <textarea id={id} rows={4} required value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            )}
          </FormField>
          <div className="form-actions">
            <button className="btn" onClick={create} disabled={submitting}>
              {submitting ? 'Sending…' : 'Send'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
