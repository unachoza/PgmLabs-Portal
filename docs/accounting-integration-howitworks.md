# How the Accounting Integration Works (Phase 0)

This describes what is **actually implemented today** on the `feature/accounting-phase0`
branch (PR #5). For the multi-phase roadmap see
[accounting-integration-plan.md](accounting-integration-plan.md); for the why see
[accounting-partnership-idea.md](accounting-partnership-idea.md).

> **Honesty note.** Phase 0 does **not** poll Tripletex's live API. "Sync now"
> normalizes and stores a **built-in sample** of the real July 2026 Førstehjelperen
> AS P&L (pulled once via the Claude-side Tripletex integration during the
> hackathon). The end-to-end pipeline — normalize → store → aggregate → funder KPI —
> is real; only the live network fetch is deferred to Phase 1. **No Tripletex API
> key is required to run or demo this.**

---

## What it does

Gives admins a "Cohort Financials" screen that turns a company's profit & loss into
a normalized, comparable record, and rolls those records up into aggregate metrics
funders can see — without exposing any company's raw financials to funders.

## Data flow

```
Admin clicks "Sync now"
        │
        ▼
POST /api/accounting/sync                       (api/accounting/sync.ts)
   • looks up the connection → provider = 'tripletex'
   • no report passed → uses TRIPLETEX_SAMPLE_REPORT   ← Phase 0 sample
   • getAdapter('tripletex').normalize(report, period) (api/_lib/accounting/tripletex.ts)
        → { revenue, cogs, payroll, otherOpex, netResult, currency, raw }
   • upsert into pnl_snapshots (one row per company per period)
        │
        ▼
POST /api/metrics/aggregate-financials          (api/metrics/aggregate-financials.ts)
   • groups pnl_snapshots by cohort + period + currency
   • writes cohort_revenue / cohort_net_result / companies_profitable /
     companies_burning_cash into metrics_snapshots
        │
        ▼
Funder dashboard reads /api/metrics (unchanged, aggregate-only)
   → sees the new cohort KPIs, never any company-level row
```

## Pieces

### 1. Database — `supabase/migrations/003_accounting.sql`

| Table | Purpose | Who can read (RLS) |
|---|---|---|
| `accounting_connections` | one authorized participant ↔ backend link | owner participant + admin |
| `accounting_tokens` | OAuth/API secrets (Phase 1) | **nobody** — RLS on, zero policies (deny-all) |
| `pnl_snapshots` | normalized 5-line P&L, one row per company per period | owner participant + admin |
| `accounting_consents` | append-only consent ledger | owner participant + admin |

**No table has a funder policy.** Exactly like `participants`/`responses` in
`002_rls.sql`, funders are structurally excluded from company-level financials.
The five money columns on `pnl_snapshots` (`revenue`, `cogs`, `payroll`,
`other_opex`, `net_result`) **are** the backend-agnostic common schema.

### 2. Adapter layer — `api/_lib/accounting/`

- `types.ts` — `NormalizedPnL`, the common schema every provider maps into.
- `adapter.ts` — the `AccountingAdapter` interface. `normalize()` is the Phase 0
  method; `getAuthorizeUrl/exchangeCode/refresh/fetchPnL` are optional seams for
  Phase 1's live OAuth pull.
- `tripletex.ts` — the one real adapter. `normalize()` reads a Tripletex
  "Resultatrapport" and maps the Norwegian account groups into the common lines:
  | Tripletex group | Common line |
  |---|---|
  | Driftsinntekter | revenue |
  | Varekostnad | cogs |
  | Lønnskostnad | payroll |
  | Annen driftskostnad | other_opex |
  | Årsresultat | net_result |
  It also exports `TRIPLETEX_SAMPLE_REPORT` — the real July figures used by Phase 0.
- `index.ts` — `getAdapter(provider)` registry. Endpoints resolve an adapter by the
  connection's `provider` column and stay otherwise provider-blind.

### 3. API endpoints

| Endpoint | Method / role | Purpose |
|---|---|---|
| `/api/accounting/connections` | GET (admin all / participant own), POST (admin) | list connections (never tokens); create one + a `granted` consent row |
| `/api/accounting/sync` | POST (admin) | normalize a report (or the Phase 0 sample) into a `pnl_snapshots` row |
| `/api/accounting/snapshots` | GET (admin all/filter, participant own) | read normalized P&L — **no funder role** |
| `/api/metrics/aggregate-financials` | POST (admin) | roll snapshots into `metrics_snapshots` |

All follow the repo pattern: `requireRole` → `parseBody` (zod) → `supabaseAdmin` →
`ok/fail`, with `audit_logs` entries for connect / sync / aggregate.

### 4. Frontend

- **Admin → Cohort Financials** (`src/features/admin/AdminFinancialsPage.tsx`, route
  `/financials`): KPI cards (total revenue, total net result, companies burning
  cash), a per-company table with a **Sync now** button and red/green net-result
  coloring, and a net-result-by-company chart. "Connect a company" opens a modal to
  register a connection.
- **Funder dashboard**: `METRIC_LABELS` extended with the four new aggregate keys —
  no new funder data path, it already reads `metrics_snapshots` via `/api/metrics`.

## Running / testing it (for a teammate)

**No Tripletex key needed.** You need the same Supabase setup the rest of the portal
uses, plus the new migration:

1. **Apply the migration.** Run `supabase/migrations/003_accounting.sql` against your
   Supabase project (Supabase SQL editor, or `supabase db push` if you use the CLI).
   Requires `001_init.sql` + `002_rls.sql` already applied.
2. **Env vars** (already required by the app — nothing accounting-specific):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY`.
3. `npm install && npm run dev` (frontend) with the Vercel API functions running
   (`vercel dev`, or your usual local API setup).
4. Log in as an **admin**; make sure at least one **participant** exists.
5. Go to **Cohort Financials → Connect a company** → pick the participant, provider
   **Tripletex**, any company name → **Connect**.
6. Click **Sync now** → the July P&L (revenue 160,445 / net −226,836 NOK) appears in
   the table and KPI cards, and the funder dashboard's cohort KPIs update.

## What's real vs. deferred

| | Status |
|---|---|
| Common schema + normalization mapping | ✅ real, testable |
| Store → aggregate → funder KPI pipeline | ✅ real |
| RLS funder-exclusion + consent ledger | ✅ real (untested against live DB) |
| "Sync now" data source | ⚠️ built-in sample (real numbers), not a live fetch |
| Live Tripletex/QBO/Xero API pull (`fetchPnL`) | ⛔ Phase 1 — not implemented |
| Per-company OAuth + token encryption | ⛔ Phase 1 |

## Extending it

- **Add a provider (QBO/Xero):** create `api/_lib/accounting/<provider>.ts`
  implementing `normalize()`, register it in `index.ts`. Nothing else changes —
  endpoints are provider-blind.
- **Make Tripletex a live pull:** implement `fetchPnL()` on the Tripletex adapter
  against Tripletex's API (needs `TRIPLETEX_CONSUMER_TOKEN` + `TRIPLETEX_EMPLOYEE_TOKEN`,
  already stubbed in `.env.example`), and have `sync.ts` call `fetchPnL()` instead of
  falling back to the sample.
