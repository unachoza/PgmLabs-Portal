# PgmLabs Portal

A business accelerator management portal. Program staff stay in contact with participants, capture outcome data over time, and report credible impact metrics to funders.

**Stack:** React + TypeScript + pure CSS (Vite) · Node serverless API (Vercel Functions) · Supabase/Postgres · deployed on Vercel.

## Roles

| Role | Sees |
|---|---|
| **Participant** | Own profile & cohort, check-ins from staff, surveys to complete, communication history |
| **Administrator** | Participant records, check-in composer (individual + bulk), survey builder, response review with theme tagging, funder communications, marketing campaigns, CSV export |
| **Funder** | Aggregate impact dashboard (KPIs + trends), cohort filters, program updates. Never sees participant-level data. |

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase project values:

```bash
cp .env.example .env
```

- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — browser-only Supabase auth.
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — server-only Supabase access for API functions and sync scripts. **Never** expose the service-role key to the browser; it bypasses RLS.
- `HUBSPOT_TOKEN` — HubSpot private app access token used by the sync script.

For HubSpot, create a private app in HubSpot and grant these read scopes:

- `crm.objects.contacts.read`
- `crm.objects.companies.read`
- `crm.objects.deals.read`
- `crm.objects.tickets.read`

### 3. Apply the database schema

Run the migrations in order against your Supabase project (SQL editor, `psql`, or `supabase db push`):

```bash
supabase/migrations/001_init.sql   # tables, enums, indexes
supabase/migrations/002_rls.sql    # row-level security policies
supabase/migrations/003_hubspot.sql # HubSpot CRM sync tables
```

### 4. Seed sample data (local/dev only)

```bash
supabase/seed.sql
```

Creates one admin, one funder, and 15 participants across three cohorts, plus sample check-ins, responses, surveys, metrics, funder updates, and campaign drafts.

Seeded logins (password `Passw0rd!` for all):

- `admin@accelerator.dev` — administrator
- `funder@accelerator.dev` — funder
- `amara.okafor@participant.dev` (and 14 others) — participants

> The seed script inserts directly into `auth.users`, which is fine for local development but should not be run against production.

## Running locally

```bash
npm run dev
```

Vite serves the frontend. To exercise the `/api` functions locally you need the Vercel CLI, which runs both together:

```bash
vercel dev
```

## Scripts

- `npm run dev` — Vite dev server (frontend only)
- `npm run build` — type-check and build for production
- `npm run preview` — preview the production build
- `npx tsc -p api/tsconfig.json --noEmit` — type-check the API functions

## Deploying

Push to a Vercel-connected repository. Set all five environment variables in the Vercel project settings (the two `VITE_` ones are build-time; the three server ones are runtime).

For HubSpot imports, run the manual sync script when you need to refresh data:

```bash
npm run hubspot:sync
```

You can preview row counts first with:

```bash
node scripts/hubspot-sync.mjs --dry-run
```

## API

All endpoints return a consistent envelope:

```json
{ "success": true, "data": {}, "error": null }
```

| Endpoint | Methods | Access |
|---|---|---|
| `/api/auth/me` | GET | any signed-in user |
| `/api/participants` | GET, POST | admin |
| `/api/participants/[id]` | GET, PATCH, DELETE | admin (GET also participant, own record only) |
| `/api/participants/me` | GET | participant |
| `/api/checkins` | GET, POST | admin; participant sees own only |
| `/api/checkins/[id]/respond` | POST | participant (own check-in only) |
| `/api/responses` | GET | admin |
| `/api/responses/[id]/tags` | PUT | admin |
| `/api/surveys` | GET, POST | admin; participant sees active only |
| `/api/surveys/[id]` | GET, PATCH, DELETE | admin |
| `/api/surveys/[id]/submissions` | GET (admin), POST (participant) | mixed |
| `/api/metrics` | GET | admin, funder |
| `/api/funder-updates` | GET (admin, funder), POST (admin) | mixed |
| `/api/funder-updates/[id]` | PATCH | admin |
| `/api/campaigns` | GET, POST | admin |
| `/api/campaigns/[id]/send` | POST | admin |
| `/api/export/participants` | GET | admin |

Request bodies are validated with Zod; invalid input returns `400` with a field-level message.

## Testing

Not yet implemented. When tests are added, the two highest-value targets are:

1. **RLS policy tests** — assert that a funder-role session cannot select from `participants`, `responses`, `survey_answers`, or `communication_logs`.
2. **Funder anonymization boundary** — an integration test hitting `/api/metrics` and `/api/funder-updates` with a funder token, asserting no participant PII appears in the response.

Broad UI coverage was deliberately deferred; these two are the failures that would actually be dangerous.

## Manual HubSpot sync

Run the one-time import script from the project root:

```bash
npm run hubspot:sync
```

The script reads `.env`, pulls contacts, companies, deals, and tickets from HubSpot, and upserts them into the `hubspot_*` tables in Supabase.

To preview the row counts without writing anything, run:

```bash
node scripts/hubspot-sync.mjs --dry-run
```

## Architecture notes

See [ARCHITECTURE.md](ARCHITECTURE.md).
