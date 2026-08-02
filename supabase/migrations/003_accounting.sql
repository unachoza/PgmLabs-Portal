-- Accounting integration — automatic financial tracking (Phase 0)
--
-- Adds the tables behind the portal's core positioning: pull cohort companies'
-- real P&L from their bookkeeping backend (Tripletex/QBO/Xero) and normalize it
-- into one common schema, instead of manual self-reported numbers.
--
-- Privacy model mirrors 002_rls.sql exactly: raw, company-level financials live
-- in participant-scoped tables that FUNDERS HAVE NO POLICY ON. Funders only ever
-- see aggregates, and only through the existing metrics_snapshots table.

create type accounting_provider as enum ('tripletex', 'qbo', 'xero', 'wave');
create type connection_status as enum ('pending', 'active', 'revoked', 'error');
create type consent_action as enum ('granted', 'revoked');

-- Connections: one authorized link between a participant and a bookkeeping backend.
create table accounting_connections (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  provider accounting_provider not null,
  external_company_id text,
  external_company_name text,
  status connection_status not null default 'pending',
  scope text not null default 'read_only',
  connected_at timestamptz,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (participant_id, provider, external_company_id)
);

create index accounting_connections_participant_idx on accounting_connections(participant_id);

-- Tokens: OAuth/API secrets, split from the connection row so they can be locked
-- to deny-all and never returned by a list endpoint. Unused in Phase 0 (manual
-- ingestion), created now so the OAuth flow in Phase 1 has a home.
create table accounting_tokens (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references accounting_connections(id) on delete cascade,
  access_token text not null,          -- encrypted at rest (app-level, Phase 1)
  refresh_token text,
  token_type text,
  expires_at timestamptz,
  realm_id text,
  updated_at timestamptz not null default now()
);

-- Normalized P&L: one row per company per period, in the common 5-line schema.
-- These five money columns ARE the backend-agnostic contract every adapter maps into.
create table pnl_snapshots (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references accounting_connections(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  cohort text,                         -- snapshot of the participant's cohort at pull time
  provider accounting_provider not null,
  currency text not null,              -- 'NOK', 'USD'... never sum across currencies blindly
  period_start date not null,
  period_end date not null,
  revenue numeric not null default 0,
  cogs numeric not null default 0,
  payroll numeric not null default 0,
  other_opex numeric not null default 0,
  net_result numeric not null default 0,
  raw_json jsonb,                      -- provider's original payload, so mappings can be re-derived
  source text not null default 'sync' check (source in ('sync', 'manual')),
  pulled_at timestamptz not null default now(),
  unique (connection_id, period_start, period_end)
);

create index pnl_snapshots_participant_idx on pnl_snapshots(participant_id);
create index pnl_snapshots_period_idx on pnl_snapshots(period_start, period_end);

-- Consent ledger: append-only. Revocation is a new row, never an update. This is
-- the legal spine of "explicit, read-only, revocable, scoped".
create table accounting_consents (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  connection_id uuid references accounting_connections(id) on delete set null,
  action consent_action not null,
  scope text not null default 'read_only:pnl',
  agreement_version text not null,
  ip_address text,
  user_agent text,
  actor_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index accounting_consents_participant_idx on accounting_consents(participant_id);

-- Row Level Security — defense-in-depth backstop, same pattern as 002_rls.sql.
-- Owner (participant) + admin only. NO FUNDER POLICY on any of these = funders
-- are structurally excluded from company-level financials.

alter table accounting_connections enable row level security;
alter table accounting_tokens enable row level security;
alter table pnl_snapshots enable row level security;
alter table accounting_consents enable row level security;

-- accounting_connections: owner reads own, admin manages all.
create policy accounting_connections_owner_select on accounting_connections for select
  using (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );
create policy accounting_connections_admin_write on accounting_connections for insert
  with check (current_role_name() = 'admin');
create policy accounting_connections_admin_update on accounting_connections for update
  using (current_role_name() = 'admin');
create policy accounting_connections_admin_delete on accounting_connections for delete
  using (current_role_name() = 'admin');

-- accounting_tokens: RLS enabled, NO policy = deny-all. Only the service-role
-- key (server API) can ever touch it, and only inside sync/refresh handlers.

-- pnl_snapshots: owner reads own, admin manages all. No funder policy.
create policy pnl_snapshots_owner_select on pnl_snapshots for select
  using (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );
create policy pnl_snapshots_admin_write on pnl_snapshots for all
  using (current_role_name() = 'admin');

-- accounting_consents: owner reads/inserts own, admin reads all.
create policy accounting_consents_owner_select on accounting_consents for select
  using (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );
create policy accounting_consents_owner_insert on accounting_consents for insert
  with check (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );
