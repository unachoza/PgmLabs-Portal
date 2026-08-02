# Accounting-Integration Layer — Implementation Plan

**Goal:** deliver the portal's core positioning — pull cohort companies' real P&L
automatically from their bookkeeping backend and normalize it into one schema —
instead of manual self-reported numbers.

**Status:** Phase 0 implemented (see "What's built" below). Phases 1–2 planned.

Related: [accounting-partnership-idea.md](accounting-partnership-idea.md) (the
partnership rationale) · [../PRODUCT.md](../PRODUCT.md) (product truth).

---

## How it fits the existing architecture

The repo has one repeatable pattern this plan mirrors everywhere:

- **API:** one file per route under `api/`, `requireRole(...)` first, `parseBody`
  for zod input, `supabaseAdmin` for data, `ok()/fail()` envelopes, `audit_logs`
  for audit-worthy actions.
- **Data:** SQL migrations in `supabase/migrations/`, RLS in a companion file as a
  defense-in-depth backstop with the hard rule that **funders get no policy on any
  participant-level table**.
- **Frontend:** `src/features/{role}/` pages, data via `useApiResource`/`api`,
  types in `src/lib/types.ts`, nav in `AppShell.tsx`, routes in `App.tsx`.

**The load-bearing precedent** is the funder-anonymization pattern: `/api/metrics`
reads only from pre-aggregated `metrics_snapshots` and never joins participant
rows. This plan reuses it exactly — raw financials live in participant-scoped
tables funders have no route to, and an aggregation step rolls them into
`metrics_snapshots`, the only thing the funder route touches.

## Data model (migration `003_accounting.sql`)

- **`accounting_connections`** — one row per authorized participant↔backend link
  (`provider`, `external_company_*`, `status`, `last_synced_at`).
- **`accounting_tokens`** — OAuth/API secrets, split out and locked to **deny-all
  RLS** (only the service-role key reads it, inside sync/refresh). Encrypted at
  rest in Phase 1. Unused in Phase 0.
- **`pnl_snapshots`** — the normalized 5-line common schema, one row per company
  per period: `revenue`, `cogs`, `payroll`, `other_opex`, `net_result`, plus
  `currency`, `raw_json`, `source`.
- **`accounting_consents`** — append-only consent ledger (revocation = new row).
  The legal spine of "explicit, read-only, revocable, scoped".

RLS on all four mirrors `002_rls.sql`: owner (participant) + admin only, **no
funder policy anywhere**; `accounting_tokens` gets RLS enabled with zero policies.

## Normalization layer (`api/_lib/accounting/`)

- **`types.ts`** — `NormalizedPnL`, the backend-agnostic contract (the five money
  lines every provider maps into).
- **`adapter.ts`** — `AccountingAdapter` interface: `normalize()` (Phase 0) plus
  optional `getAuthorizeUrl/exchangeCode/refresh/fetchPnL` seams (Phase 1).
- **`tripletex.ts`** — first real adapter; maps Tripletex's Norwegian account
  groups (Driftsinntekter → revenue, Varekostnad → COGS, Lønnskostnad → payroll,
  Annen driftskostnad → other opex, Årsresultat → net result).
- **`index.ts`** — provider registry; endpoints resolve an adapter by the
  connection's `provider` and stay provider-blind. QBO/Xero slot in here.

## API endpoints

| File | Method / role | Purpose |
|---|---|---|
| `api/accounting/connections/index.ts` | GET (admin all / participant own), POST (admin) | List connections (never tokens); create a connection + consent record. |
| `api/accounting/sync.ts` | POST (admin) | Normalize a provider report into a `pnl_snapshots` row for a period. |
| `api/accounting/snapshots/index.ts` | GET (admin all/filter, participant own) | Read normalized P&L. **No funder role.** |
| `api/metrics/aggregate-financials.ts` | POST (admin) | Roll `pnl_snapshots` into `metrics_snapshots` (cohort revenue/net, profitable/burning counts). |

**Non-negotiable:** no `api/accounting/*` route ever accepts `funder`. Funders
reach financials only via aggregated `metrics_snapshots` through `/api/metrics`.

## Frontend surfaces

- **Admin — Cohort Financials** (`src/features/admin/AdminFinancialsPage.tsx`,
  route `/financials`): KPI cards (total revenue, total net, companies burning
  cash), a per-company table with a **Sync now** button, and a net-result chart.
  Early-warning coloring for negative net result.
- **Funder — aggregate view:** extends `FunderDashboardPage` `METRIC_LABELS` only
  (new keys `cohort_revenue`, `cohort_net_result`, `companies_profitable`,
  `companies_burning_cash`). No new funder data path.
- **Participant — "Connect your accounting"** (Phase 1): consent-gated OAuth
  connect/disconnect screen.

## Connection / consent model

**Recommended default: per-company OAuth** — the only model that generalizes
across QBO/Xero and satisfies explicit/read-only/revocable/scoped. Accountant-firm
multi-entity is a provider-specific optimization (N connection rows from one
grant); the same schema supports both. Tripletex (single-key) slots in as one
connection with a stored API key rather than an OAuth dance.

Tokens live in `accounting_tokens` (deny-all), encrypted at rest with
`ACCOUNTING_TOKEN_ENC_KEY` (AES-256-GCM). Revocation calls the provider revoke
endpoint, deletes the token row, sets `status='revoked'`, and appends a `revoked`
consent row.

## Phased rollout

- **Phase 0 — hackathon demo MVP (DONE):** migration + Tripletex adapter + manual
  connection registration + `Sync now` (uses the real July P&L via the built-in
  Tripletex sample) + snapshots endpoint + aggregation → live cohort KPI on the
  funder dashboard. End-to-end demoable.
- **Phase 1 — consent + one real OAuth provider:** participant consent screen +
  data agreement; QBO or Xero OAuth (connect/callback + token encryption);
  revocation flow.
- **Phase 2 — multi-company production:** scheduled Vercel cron sync; refresh-token
  rotation; `status='error'` surfacing/retry; second/third adapter; RLS +
  aggregation tests.

## Key risks & open decisions

- **Multi-company access is a business decision, not just code.** Don't market
  cohort-wide coverage until real connection coverage exists (Intuit accountant-firm
  arrangement, or every founder completing OAuth).
- **Currency mixing.** Tripletex is NOK, QBO cohort would be USD. Aggregation keys
  on currency so mixed cohorts never sum into a bogus total — but a reporting-currency
  + FX decision is needed before cross-currency cohort totals mean anything.
- **Lossy 5-line mapping.** Providers bucket accounts differently (COGS vs opex,
  payroll). Each adapter's mapping needs founder/accountant validation; `raw_json`
  is stored so mappings can be re-derived.
- **RLS is load-bearing and untested.** Adding financial tables raises the stakes
  on the funder-exclusion RLS gamble — write the exclusion tests before real data.
- **Token security.** App-level encryption + deny-all RLS is the design, but the
  service-role key can read everything; consider Supabase Vault/KMS for the key.
- **OAuth `state`/CSRF.** The Phase 1 callback can't use `requireRole`; a signed,
  single-use `state` is the only thing binding it to the initiating founder.

## What's built (Phase 0)

`003_accounting.sql`; `api/_lib/accounting/{types,adapter,tripletex,index}.ts`;
`api/accounting/{connections/index,sync,snapshots/index}.ts`;
`api/metrics/aggregate-financials.ts`; `src/features/admin/AdminFinancialsPage.tsx`
(+ types, nav, route, funder labels, `.banner-success` style). Frontend build and
API type-check pass.
