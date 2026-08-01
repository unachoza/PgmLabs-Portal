import { useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { MarketingCampaign } from '../../lib/types';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';

export function AdminCampaignsPage() {
  const { data: campaigns, loading, error, reload } = useApiResource<MarketingCampaign[]>('/campaigns');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', audience_segment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function create() {
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/campaigns', form);
      setShowCreate(false);
      setForm({ title: '', content: '', audience_segment: '' });
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create campaign.');
    } finally {
      setSubmitting(false);
    }
  }

  async function sendCampaign(id: string) {
    await api.post(`/campaigns/${id}/send`);
    await reload();
  }

  const columns: Column<MarketingCampaign>[] = [
    { key: 'title', header: 'Title', render: (c) => c.title },
    { key: 'audience_segment', header: 'Audience', render: (c) => c.audience_segment },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    { key: 'sent_at', header: 'Sent', render: (c) => (c.sent_at ? new Date(c.sent_at).toLocaleDateString() : '—') },
    {
      key: 'action',
      header: '',
      render: (c) =>
        c.status === 'draft' && (
          <button className="btn btn-sm" onClick={() => sendCampaign(c.id)}>
            Send
          </button>
        ),
    },
  ];

  if (loading) return <div className="page-loading">Loading campaigns…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Marketing Campaigns</h1>
      <div className="toolbar">
        <button className="btn" onClick={() => setShowCreate(true)}>
          Draft campaign
        </button>
      </div>
      <DataTable columns={columns} rows={campaigns ?? []} emptyMessage="No campaigns drafted yet." />

      {showCreate && (
        <Modal title="Draft campaign" onClose={() => setShowCreate(false)}>
          {formError && <div className="banner-error">{formError}</div>}
          <FormField label="Title" required>
            {(id) => <input id={id} required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}
          </FormField>
          <FormField label="Audience segment" required hint="e.g. prospects, alumni, current cohort">
            {(id) => (
              <input
                id={id}
                required
                value={form.audience_segment}
                onChange={(e) => setForm({ ...form, audience_segment: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Content" required>
            {(id) => (
              <textarea id={id} rows={5} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            )}
          </FormField>
          <div className="form-actions">
            <button className="btn" onClick={create} disabled={submitting}>
              {submitting ? 'Saving…' : 'Save draft'}
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
