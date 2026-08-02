export function KpiCard({
  title,
  value,
  hint,
  verified,
}: {
  title: string;
  value: string;
  hint?: string;
  /** Marks this figure as pulled automatically from a source system, not self-reported. */
  verified?: boolean;
}) {
  return (
    <div className={`card${verified ? ' card-verified' : ''}`}>
      <div className="card-title-row">
        <div className="card-title">{title}</div>
        {verified && (
          <span className="badge badge-verified" title="Pulled automatically from the source system, not self-reported">
            ✓ Verified
          </span>
        )}
      </div>
      <div className="card-value">{value}</div>
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}
