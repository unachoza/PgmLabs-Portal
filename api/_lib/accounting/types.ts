// The backend-agnostic common schema. Every provider (Tripletex, QBO, Xero)
// maps its own P&L report into exactly these five money lines, so the rest of
// the app never has to know which bookkeeping backend a company uses.
export type NormalizedPnL = {
  currency: string;
  periodStart: string; // ISO date, inclusive
  periodEnd: string; // ISO date, inclusive
  revenue: number;
  cogs: number;
  payroll: number;
  otherOpex: number;
  netResult: number;
  raw: unknown; // provider's original payload, stored in pnl_snapshots.raw_json
};

export type AccountingProvider = 'tripletex' | 'qbo' | 'xero' | 'wave';
