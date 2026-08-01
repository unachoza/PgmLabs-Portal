import type { AccountingAdapter } from './adapter';
import type { AccountingProvider } from './types';
import { tripletexAdapter } from './tripletex';

// Provider registry. Every endpoint resolves an adapter by the connection's
// `provider` column and stays otherwise provider-blind. Add qbo/xero here in Phase 1.
const ADAPTERS: Partial<Record<AccountingProvider, AccountingAdapter>> = {
  tripletex: tripletexAdapter,
};

export function getAdapter(provider: AccountingProvider): AccountingAdapter {
  const adapter = ADAPTERS[provider];
  if (!adapter) throw new Error(`No accounting adapter registered for provider "${provider}".`);
  return adapter;
}

export { TRIPLETEX_SAMPLE_REPORT } from './tripletex';
export type { NormalizedPnL, AccountingProvider } from './types';
