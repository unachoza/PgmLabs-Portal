import { useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import { supabase } from '../../lib/supabaseClient';
import type { Participant } from '../../lib/types';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';

export function AdminParticipantsPage() {
  const { data: participants, loading, error, reload } = useApiResource<Participant[]>('/participants');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', cohort: '', company_name: '', industry: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function createParticipant() {
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/participants', form);
      setShowCreate(false);
      setForm({ name: '', email: '', cohort: '', company_name: '', industry: '' });
      await reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create participant.');
    } finally {
      setSubmitting(false);
    }
  }

  async function exportCsv() {
    const { data } = await supabase.auth.getSession();
    const res = await fetch('/api/export/participants', {
      headers: { Authorization: `Bearer ${data.session?.access_token ?? ''}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'participants.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = (participants ?? []).filter((p) => {
    const name = p.profiles?.name ?? '';
    return name.toLowerCase().includes(search.toLowerCase()) || (p.company_name ?? '').toLowerCase().includes(search.toLowerCase());
  });

  const columns: Column<Participant>[] = [
    { key: 'name', header: 'Name', render: (p) => p.profiles?.name ?? '—' },
    { key: 'email', header: 'Email', render: (p) => p.profiles?.email ?? '—' },
    { key: 'cohort', header: 'Cohort', render: (p) => p.cohort },
    { key: 'company', header: 'Company', render: (p) => p.company_name ?? '—' },
    { key: 'industry', header: 'Industry', render: (p) => p.industry ?? '—' },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
  ];

  if (loading) return <div className="page-loading">Loading participants…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Participants</h1>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by name or company"
          aria-label="Search participants"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn" onClick={() => setShowCreate(true)}>
          Add participant
        </button>
        <button className="btn btn-secondary" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      <DataTable columns={columns} rows={filtered} emptyMessage="No participants match your search." />

      {showCreate && (
        <Modal title="Add participant" onClose={() => setShowCreate(false)}>
          {formError && <div className="banner-error">{formError}</div>}
          <FormField label="Name" required>
            {(id) => (
              <input id={id} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            )}
          </FormField>
          <FormField label="Email" required>
            {(id) => (
              <input
                id={id}
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            )}
          </FormField>
          <FormField label="Cohort" required>
            {(id) => (
              <input id={id} required value={form.cohort} onChange={(e) => setForm({ ...form, cohort: e.target.value })} />
            )}
          </FormField>
          <FormField label="Company name">
            {(id) => (
              <input id={id} value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            )}
          </FormField>
          <FormField label="Industry">
            {(id) => (
              <input id={id} value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            )}
          </FormField>
          <div className="form-actions">
            <button className="btn" onClick={createParticipant} disabled={submitting}>
              {submitting ? 'Creating…' : 'Create'}
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
