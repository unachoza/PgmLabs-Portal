import type { AccountingProvider, NormalizedPnL } from './types';

export type Period = { start: string; end: string };

// One adapter per bookkeeping backend. Phase 0 only exercises `normalize` (manual
// ingestion of a report already fetched); the OAuth/fetch methods are the seams
// Phase 1 fills in without changing any caller.
export interface AccountingAdapter {
  provider: AccountingProvider;

  // Map a provider-native P&L report into the common schema. Pure and testable —
  // this is the heart of "backend-agnostic".
  normalize(report: unknown, period: Period): NormalizedPnL;

  // --- Phase 1 (OAuth + live pull); optional so Phase 0 adapters can omit them ---
  getAuthorizeUrl?(state: string, redirectUri: string): string;
  exchangeCode?(code: string, redirectUri: string): Promise<TokenSet>;
  refresh?(tokens: TokenSet): Promise<TokenSet>;
  fetchPnL?(tokens: TokenSet, period: Period): Promise<NormalizedPnL>;
}

export type TokenSet = {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: string;
  realmId?: string;
};
