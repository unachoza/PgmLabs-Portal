-- HubSpot CRM sync tables.

create table hubspot_contacts (
  hubspot_id text primary key,
  archived boolean not null default false,
  email text,
  firstname text,
  lastname text,
  phone text,
  jobtitle text,
  lifecyclestage text,
  properties jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  synced_at timestamptz not null default now()
);

create index hubspot_contacts_archived_idx on hubspot_contacts(archived);
create index hubspot_contacts_email_idx on hubspot_contacts(email);
create index hubspot_contacts_updated_at_idx on hubspot_contacts(updated_at);

create table hubspot_companies (
  hubspot_id text primary key,
  archived boolean not null default false,
  name text,
  domain text,
  industry text,
  phone text,
  city text,
  state text,
  country text,
  properties jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  synced_at timestamptz not null default now()
);

create index hubspot_companies_archived_idx on hubspot_companies(archived);
create index hubspot_companies_name_idx on hubspot_companies(name);
create index hubspot_companies_updated_at_idx on hubspot_companies(updated_at);

create table hubspot_deals (
  hubspot_id text primary key,
  archived boolean not null default false,
  dealname text,
  amount numeric,
  dealstage text,
  pipeline text,
  closedate date,
  dealtype text,
  hubspot_owner_id text,
  properties jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  synced_at timestamptz not null default now()
);

create index hubspot_deals_archived_idx on hubspot_deals(archived);
create index hubspot_deals_dealstage_idx on hubspot_deals(dealstage);
create index hubspot_deals_updated_at_idx on hubspot_deals(updated_at);

create table hubspot_tickets (
  hubspot_id text primary key,
  archived boolean not null default false,
  subject text,
  content text,
  hs_pipeline text,
  hs_pipeline_stage text,
  hs_ticket_category text,
  hs_ticket_priority text,
  properties jsonb not null default '{}'::jsonb,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  synced_at timestamptz not null default now()
);

create index hubspot_tickets_archived_idx on hubspot_tickets(archived);
create index hubspot_tickets_pipeline_stage_idx on hubspot_tickets(hs_pipeline_stage);
create index hubspot_tickets_updated_at_idx on hubspot_tickets(updated_at);

create table hubspot_sync_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null check (status in ('running', 'success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  triggered_by text not null default 'manual',
  object_count integer not null default 0,
  record_count integer not null default 0,
  summary jsonb not null default '[]'::jsonb,
  error text
);

create index hubspot_sync_runs_started_at_idx on hubspot_sync_runs(started_at desc);