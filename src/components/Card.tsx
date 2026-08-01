export function KpiCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="card">
      <div className="card-title">{title}</div>
      <div className="card-value">{value}</div>
      {hint && <div className="form-hint">{hint}</div>}
    </div>
  );
}
