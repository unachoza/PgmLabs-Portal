import { useMemo, useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import { api } from '../../lib/apiClient';
import type { AccountingConnection, PnLSnapshot, Participant, AccountingProvider } from '../../lib/types';
import { DataTable, type Column } from '../../components/DataTable';
import { StatusBadge } from '../../components/Badge';
import { KpiCard } from '../../components/Card';
import { TrendChart } from '../../components/TrendChart';
import { Modal } from '../../components/Modal';
import { FormField } from '../../components/FormField';

const PROVIDERS: { value: AccountingProvider; label: string }[] = [
  { value: 'tripletex', label: 'Tripletex' },
  { value: 'qbo', label: 'QuickBooks (Intuit)' },
  { value: 'xero', label: 'Xero' },
  { value: 'wave', label: 'Wave' },
];

// Default sync window — the July 2026 period the Tripletex sample covers.
const DEFAULT_PERIOD = { start: '2026-07-01', end: '2026-07-31' };

function money(value: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  } catch {
    return `${Math.round(value).toLocaleString()} ${currency}`;
  }
}

export function AdminFinancialsPage() {
  const connectionsQuery = useApiResource<AccountingConnection[]>('/accounting/connections');
  const snapshotsQuery = useApiResource<PnLSnapshot[]>('/accounting/snapshots');
  const { data: participants } = useApiResource<Participant[]>('/participants');

  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ participant_id: '', provider: 'tripletex' as AccountingProvider, external_company_name: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const connections = useMemo(() => connectionsQuery.data ?? [], [connectionsQuery.data]);
  const snapshots = useMemo(() => snapshotsQuery.data ?? [], [snapshotsQuery.data]);

  // Latest snapshot per connection (snapshots arrive sorted by period ascending).
  const latestByConnection = useMemo(() => {
    const map = new Map<string, PnLSnapshot>();
    for (const s of snapshots) map.set(s.connection_id, s);
    return map;
  }, [snapshots]);

  const latest = useMemo(() => [...latestByConnection.values()], [latestByConnection]);
  const currency = latest[0]?.currency ?? 'USD';
  const sameCurrency = latest.every((s) => s.currency === currency);

  const totalRevenue = latest.reduce((sum, s) => sum + Number(s.revenue), 0);
  const totalNet = latest.reduce((sum, s) => sum + Number(s.net_result), 0);
  const burningCash = latest.filter((s) => Number(s.net_result) < 0).length;

  const netTrend = useMemo(
    () =>
      latest.map((s) => ({
        label: s.accounting_connections?.external_company_name ?? s.participants?.company_name ?? '—',
        value: Math.round(Number(s.net_result)),
      })),
    [latest],
  );

  async function syncNow(connectionId: string) {
    setSyncingId(connectionId);
    setBanner(null);
    try {
      await api.post('/accounting/sync', { connection_id: connectionId, period_start: DEFAULT_PERIOD.start, period_end: DEFAULT_PERIOD.end });
      // Roll the new figures into aggregate metrics so the funder dashboard updates.
      await api.post('/metrics/aggregate-financials');
      await Promise.all([connectionsQuery.reload(), snapshotsQuery.reload()]);
      setBanner('Synced and aggregated. Funder dashboard metrics refreshed.');
    } catch (err) {
      setBanner(err instanceof Error ? err.message : 'Sync failed.');
    } finally {
      setSyncingId(null);
    }
  }

  async function createConnection() {
    setSubmitting(true);
    setFormError(null);
    try {
      await api.post('/accounting/connections', form);
      setShowCreate(false);
      setForm({ participant_id: '', provider: 'tripletex', external_company_name: '' });
      await connectionsQuery.reload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Could not create connection.');
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<AccountingConnection>[] = [
    {
      key: 'company',
      header: 'Company',
      render: (c) => c.external_company_name ?? c.participants?.company_name ?? '—',
    },
    { key: 'participant', header: 'Participant', render: (c) => c.participants?.profiles?.name ?? '—' },
    { key: 'provider', header: 'Source', render: (c) => PROVIDERS.find((p) => p.value === c.provider)?.label ?? c.provider },
    { key: 'status', header: 'Status', render: (c) => <StatusBadge status={c.status} /> },
    {
      key: 'revenue',
      header: 'Revenue (latest)',
      render: (c) => {
        const s = latestByConnection.get(c.id);
        return s ? money(Number(s.revenue), s.currency) : '—';
      },
    },
    {
      key: 'net',
      header: 'Net result (latest)',
      render: (c) => {
        const s = latestByConnection.get(c.id);
        if (!s) return '—';
        const net = Number(s.net_result);
        return (
          <span style={{ color: net < 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
            {money(net, s.currency)}
          </span>
        );
      },
    },
    {
      key: 'synced',
      header: 'Last synced',
      render: (c) => (c.last_synced_at ? new Date(c.last_synced_at).toLocaleDateString() : 'never'),
    },
    {
      key: 'action',
      header: '',
      render: (c) => (
        <button className="btn btn-sm" disabled={syncingId === c.id || c.status === 'revoked'} onClick={() => syncNow(c.id)}>
          {syncingId === c.id ? 'Syncing…' : 'Sync now'}
        </button>
      ),
    },
  ];

  if (connectionsQuery.loading) return <div className="page-loading">Loading cohort financials…</div>;
  if (connectionsQuery.error) return <div className="banner-error">{connectionsQuery.error}</div>;

  return (
    <div>
      <h1>Cohort Financials</h1>
      <p className="form-hint" style={{ marginTop: 'calc(-1 * var(--space-2))' }}>
        Real P&amp;L pulled from each company's accounting backend and normalized to one schema — not self-reported.
      </p>

      {banner && <div className="banner-success" role="status">{banner}</div>}

      <div className="toolbar">
        <button className="btn" onClick={() => setShowCreate(true)}>Connect a company</button>
      </div>

      {latest.length > 0 && (
        <div className="card-grid" style={{ marginBottom: 'var(--space-5)' }}>
          <KpiCard
            verified
            title="Total revenue"
            value={money(totalRevenue, currency)}
            hint={sameCurrency ? 'Latest period, all connected companies' : 'Mixed currencies — see per-company table'}
          />
          <KpiCard
            verified
            title="Total net result"
            value={money(totalNet, currency)}
            hint={sameCurrency ? 'Sum of latest net results' : 'Mixed currencies'}
          />
          <KpiCard verified title="Companies burning cash" value={String(burningCash)} hint={`of ${latest.length} connected`} />
        </div>
      )}

      <DataTable
        columns={columns}
        rows={connections}
        emptyMessage="No companies connected yet. Connect a company, then Sync now to pull its P&L."
      />

      {netTrend.length > 0 && (
        <div className="card" style={{ marginTop: 'var(--space-5)' }}>
          <h2>Net result by company (latest period)</h2>
          <TrendChart data={netTrend} label="Net result by company" />
        </div>
      )}

      {showCreate && (
        <Modal title="Connect a company" onClose={() => setShowCreate(false)}>
          {formError && <div className="banner-error">{formError}</div>}
          <FormField label="Participant" required>
            {(id) => (
              <select id={id} required value={form.participant_id} onChange={(e) => setForm({ ...form, participant_id: e.target.value })}>
                <option value="">Select a participant…</option>
                {(participants ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.profiles?.name ?? p.company_name ?? p.id} {p.company_name ? `— ${p.company_name}` : ''}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <FormField label="Accounting backend" required>
            {(id) => (
              <select id={id} value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value as AccountingProvider })}>
                {PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            )}
          </FormField>
          <FormField label="Company name (as in their books)" required>
            {(id) => (
              <input id={id} required value={form.external_company_name} onChange={(e) => setForm({ ...form, external_company_name: e.target.value })} />
            )}
          </FormField>
          <div className="form-actions">
            <button className="btn" onClick={createConnection} disabled={submitting}>
              {submitting ? 'Connecting…' : 'Connect'}
            </button>
            <button className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
