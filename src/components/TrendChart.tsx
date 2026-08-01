export function TrendChart({
  data,
  label,
}: {
  data: { label: string; value: number }[];
  label: string;
}) {
  if (data.length === 0) return <div className="empty-state">No data for this range.</div>;

  const width = 560;
  const height = 200;
  const padding = 32;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = (width - padding * 2) / data.length - 12;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`${label} trend chart`}
      style={{ width: '100%', height: 'auto' }}
    >
      <title>{label}</title>
      {data.map((d, i) => {
        const barHeight = ((height - padding * 2) * d.value) / max;
        const x = padding + i * ((width - padding * 2) / data.length);
        const y = height - padding - barHeight;
        return (
          <g key={d.label}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill="var(--color-primary)"
              rx={3}
            />
            <text
              x={x + barWidth / 2}
              y={height - padding + 16}
              textAnchor="middle"
              fontSize="11"
              fill="var(--color-text-muted)"
            >
              {d.label}
            </text>
            <text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              fontSize="11"
              fill="var(--color-text-main)"
            >
              {d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
