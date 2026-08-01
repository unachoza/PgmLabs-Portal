import type { AccountingAdapter, Period } from './adapter';
import type { NormalizedPnL } from './types';

// Tripletex "Resultatrapport" (P&L) rows: each has a `path` ("Parent > Child")
// and `cells` positionally aligned to columns [Faktisk, Budsjett, Avvik]. We read
// the "Faktisk" (actual) column and roll the Norwegian account groups into the
// five common lines.
type TripletexRow = { path: string; leaf?: boolean; cells: number[] };
type TripletexReport = { table?: { rows?: TripletexRow[] } } & Record<string, unknown>;

// Norwegian account-group label -> which common line it feeds. Matched on the
// LAST segment of the row path, so it works whatever the parent nesting is.
const LEAF_SEGMENT = {
  revenue: 'Driftsinntekter',
  cogs: 'Varekostnad',
  payroll: 'Lønnskostnad',
  otherOpex: 'Annen driftskostnad',
  netResult: 'Årsresultat',
} as const;

function actual(rows: TripletexRow[], lastSegment: string): number {
  const row = rows.find((r) => r.path.split('>').pop()?.trim() === lastSegment);
  return row?.cells?.[0] ?? 0;
}

export const tripletexAdapter: AccountingAdapter = {
  provider: 'tripletex',

  normalize(report: unknown, period: Period): NormalizedPnL {
    const rows = (report as TripletexReport)?.table?.rows ?? [];
    return {
      currency: 'NOK', // Tripletex company in this integration keeps books in NOK
      periodStart: period.start,
      periodEnd: period.end,
      revenue: actual(rows, LEAF_SEGMENT.revenue),
      cogs: actual(rows, LEAF_SEGMENT.cogs),
      payroll: actual(rows, LEAF_SEGMENT.payroll),
      otherOpex: actual(rows, LEAF_SEGMENT.otherOpex),
      netResult: actual(rows, LEAF_SEGMENT.netResult),
      raw: report,
    };
  },
};

// Real July 2026 P&L for Førstehjelperen AS, pulled live via the Tripletex
// integration during the hackathon. Kept here so Phase 0 "Sync now" demonstrates
// the full normalize → store → aggregate path with genuine numbers before the
// live OAuth pull lands in Phase 1. Trimmed to the group rows the normalizer reads.
export const TRIPLETEX_SAMPLE_REPORT: TripletexReport = {
  table: {
    rows: [
      { path: 'Driftsresultat > Driftsinntekter', leaf: false, cells: [160445, 0, 160445] },
      { path: 'Driftsresultat > Driftskostnader > Varekostnad', leaf: false, cells: [44767.5, 0, 44767.5] },
      { path: 'Driftsresultat > Driftskostnader > Lønnskostnad', leaf: false, cells: [272482.6, 0, 272482.6] },
      { path: 'Driftsresultat > Driftskostnader > Annen driftskostnad', leaf: false, cells: [70030.67, 0, 70030.67] },
      { path: 'Årsresultat', leaf: true, cells: [-226835.77, 0, -226835.77] },
    ],
  },
};
