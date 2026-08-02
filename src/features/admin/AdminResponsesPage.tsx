import { useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { ResponseTag } from '../../lib/types';
import { DataTable, type Column } from '../../components/DataTable';
import { ResponsePayload } from '../../components/ResponsePayload';

type ResponseRow = {
  id: string;
  submitted_at: string;
  payload_json: Record<string, unknown>;
  response_tags: { tag: ResponseTag }[];
  participants: { company_name: string | null; cohort: string; profiles: { name: string } } | null;
};

const ALL_TAGS: ResponseTag[] = ['growth', 'hiring', 'funding', 'risk', 'other'];

export function AdminResponsesPage() {
  const { data: responses, loading, error, reload } = useApiResource<ResponseRow[]>('/responses');
  const [search, setSearch] = useState('');

  async function toggleTag(row: ResponseRow, tag: ResponseTag) {
    const current = row.response_tags.map((t) => t.tag);
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    await api.put(`/responses/${row.id}/tags`, { tags: next });
    await reload();
  }

  const filtered = (responses ?? []).filter((r) => {
    const name = r.participants?.profiles?.name ?? '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const columns: Column<ResponseRow>[] = [
    { key: 'name', header: 'Participant', render: (r) => r.participants?.profiles?.name ?? '—' },
    { key: 'cohort', header: 'Cohort', render: (r) => r.participants?.cohort ?? '—' },
    { key: 'submitted_at', header: 'Submitted', render: (r) => new Date(r.submitted_at).toLocaleDateString() },
    { key: 'payload', header: 'Response', render: (r) => <ResponsePayload payload={r.payload_json} /> },
    {
      key: 'tags',
      header: 'Tags',
      render: (r) => (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ALL_TAGS.map((tag) => {
            const active = r.response_tags.some((t) => t.tag === tag);
            return (
              <button
                key={tag}
                className={`badge${active ? ' badge-accent' : ''}`}
                style={{ cursor: 'pointer', border: 'none' }}
                onClick={() => toggleTag(r, tag)}
                aria-pressed={active}
              >
                {tag}
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  if (loading) return <div className="page-loading">Loading responses…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Responses</h1>
      <div className="toolbar">
        <input
          type="search"
          placeholder="Search by participant name"
          aria-label="Search responses"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <DataTable columns={columns} rows={filtered} emptyMessage="No responses match your search." />
    </div>
  );
}
