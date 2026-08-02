-- Lets participants fill out their own company/address details, current
-- challenges, and a running list of milestones — previously only admin
-- could set company_name/industry via a dedicated update, and there was no
-- self-service path at all.

alter table participants
  add column if not exists address_line1 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists zip_code text,
  add column if not exists company_website text,
  add column if not exists company_description text,
  add column if not exists current_challenges text;

create table participant_milestones (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  title text not null,
  description text,
  achieved_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index participant_milestones_participant_idx on participant_milestones(participant_id);

alter table participant_milestones enable row level security;

-- participants: add a self-update policy alongside the existing admin-only
-- one. The API restricts which columns a participant may actually change
-- (not cohort/status) — this RLS policy is defense-in-depth, not the primary
-- authorization mechanism, consistent with the rest of the schema.
create policy participants_owner_update on participants for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

create policy participant_milestones_owner_select on participant_milestones for select
  using (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );
create policy participant_milestones_owner_insert on participant_milestones for insert
  with check (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );
create policy participant_milestones_owner_update on participant_milestones for update
  using (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );
create policy participant_milestones_owner_delete on participant_milestones for delete
  using (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );
