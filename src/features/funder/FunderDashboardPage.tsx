import { useMemo, useState } from 'react';
import { useApiResource } from '../../lib/useApi';
import type { MetricSnapshot } from '../../lib/types';
import { KpiCard } from '../../components/Card';
import { TrendChart } from '../../components/TrendChart';

const METRIC_LABELS: Record<string, string> = {
  active_participants: 'Active Participants',
  jobs_created: 'Jobs Created',
  capital_raised_usd: 'Capital Raised (USD)',
  milestone_completion_rate: 'Milestone Completion Rate',
  response_rate: 'Response Rate',
};

export function FunderDashboardPage() {
  // Fetched unfiltered so the cohort and date options stay stable; the
  // dataset is aggregate snapshots, small enough to narrow client-side.
  const { data: metrics, loading, error } = useApiResource<MetricSnapshot[]>('/metrics');
  const [cohort, setCohort] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const cohorts = useMemo(
    () => Array.from(new Set((metrics ?? []).map((m) => m.cohort).filter(Boolean))) as string[],
    [metrics],
  );

  const filtered = useMemo(
    () =>
      (metrics ?? []).filter((m) => {
        if (cohort && m.cohort !== cohort) return false;
        if (from && m.period_start && m.period_start < from) return false;
        if (to && m.period_end && m.period_end > to) return false;
        return true;
      }),
    [metrics, cohort, from, to],
  );

  // Counts roll up across the selected cohorts; rates are averaged, since
  // summing percentages would produce a meaningless number.
  const kpis = useMemo(() => {
    const grouped = new Map<string, number[]>();
    for (const m of filtered) {
      grouped.set(m.metric_key, [...(grouped.get(m.metric_key) ?? []), m.metric_value]);
    }
    return [...grouped.entries()].map(([key, values]) => {
      const isRate = key.endsWith('_rate');
      const total = values.reduce((sum, v) => sum + v, 0);
      return { key, value: isRate ? total / values.length : total, isRate };
    });
  }, [filtered]);

  const jobsTrend = useMemo(
    () =>
      filtered
        .filter((m) => m.metric_key === 'jobs_created')
        .map((m) => ({ label: m.cohort ?? '—', value: m.metric_value })),
    [filtered],
  );

  if (loading) return <div className="page-loading">Loading dashboard…</div>;
  if (error) return <div className="banner-error">{error}</div>;

  return (
    <div>
      <h1>Program Impact Dashboard</h1>

      <div className="toolbar">
        <label htmlFor="cohort-filter">Cohort</label>
        <select id="cohort-filter" value={cohort} onChange={(e) => setCohort(e.target.value)}>
          <option value="">All cohorts</option>
          {cohorts.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <label htmlFor="from-filter">From</label>
        <input id="from-filter" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />

        <label htmlFor="to-filter">To</label>
        <input id="to-filter" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">No metrics match these filters.</div>
      ) : (
        <>
          <div className="card-grid" style={{ marginBottom: 'var(--space-5)' }}>
            {kpis.map(({ key, value, isRate }) => (
              <KpiCard
                key={key}
                title={METRIC_LABELS[key] ?? key}
                value={isRate ? `${Math.round(value * 100)}%` : value.toLocaleString()}
                hint={cohort || 'All cohorts'}
              />
            ))}
          </div>

          <div className="card">
            <h2>Jobs Created by Cohort</h2>
            <TrendChart data={jobsTrend} label="Jobs created by cohort" />
          </div>
        </>
      )}
    </div>
  );
}
