-- Funder-facing program events + KPIs: upcoming/past cohort events, the
-- achievement stats tied to a past cohort event, and period-wide Business
-- Resource Center activity stats (not tied to a specific cohort).
-- Admin manages; admin + funder can read (funders never see raw
-- participant-level data through this — everything here is aggregate).

create table program_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  event_type text not null check (event_type in ('upcoming', 'past')),
  event_date date not null,
  cohort text,
  location text,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index program_events_type_idx on program_events(event_type);

create table program_kpis (
  id uuid primary key default gen_random_uuid(),
  panel text not null check (panel in ('cohort_achievements', 'resource_center_activity')),
  event_id uuid references program_events(id) on delete cascade,
  label text not null,
  value text not null,
  period_label text,
  sort_order integer not null default 0,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint program_kpis_event_required_for_cohort_panel
    check (panel <> 'cohort_achievements' or event_id is not null)
);

create index program_kpis_event_idx on program_kpis(event_id);
create index program_kpis_panel_idx on program_kpis(panel);

alter table program_events enable row level security;
alter table program_kpis enable row level security;

create policy program_events_select on program_events for select
  using (current_role_name() in ('admin', 'funder'));
create policy program_events_admin_insert on program_events for insert
  with check (current_role_name() = 'admin');
create policy program_events_admin_update on program_events for update
  using (current_role_name() = 'admin');
create policy program_events_admin_delete on program_events for delete
  using (current_role_name() = 'admin');

create policy program_kpis_select on program_kpis for select
  using (current_role_name() in ('admin', 'funder'));
create policy program_kpis_admin_insert on program_kpis for insert
  with check (current_role_name() = 'admin');
create policy program_kpis_admin_update on program_kpis for update
  using (current_role_name() = 'admin');
create policy program_kpis_admin_delete on program_kpis for delete
  using (current_role_name() = 'admin');
