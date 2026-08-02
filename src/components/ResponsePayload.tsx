const FIELD_LABELS: Record<string, string> = {
  revenue_band: 'Revenue band',
  jobs_created: 'Jobs created',
  funding_raised: 'Funding raised (USD)',
  challenges: 'Challenges',
  support_needed: 'Support needed',
};

function labelFor(key: string): string {
  return FIELD_LABELS[key] ?? key.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

/** Renders a check-in response payload as labeled fields instead of raw JSON. */
export function ResponsePayload({ payload }: { payload: Record<string, unknown> }) {
  const entries = Object.entries(payload);
  if (entries.length === 0) return <span className="form-hint">No response data.</span>;

  return (
    <dl className="response-payload">
      {entries.map(([key, value]) => (
        <div className="response-payload-row" key={key}>
          <dt>{labelFor(key)}</dt>
          <dd>{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}
