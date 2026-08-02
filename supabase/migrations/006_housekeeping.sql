-- Housekeeping agent: tracks admin RSVP-style responses (yes/no/maybe) to
-- prioritized items (overdue check-ins, risk-tagged responses, pending funder
-- follow-ups, inactive participants). The items themselves are computed live
-- from existing tables by the API — this table only records what the admin
-- decided, so an item can be "snoozed" instead of re-nagging every load.

create table housekeeping_responses (
  id uuid primary key default gen_random_uuid(),
  item_key text not null,
  response text not null check (response in ('yes', 'no', 'maybe')),
  responded_by uuid not null references profiles(id) on delete cascade,
  responded_at timestamptz not null default now()
);

create unique index housekeeping_responses_item_key_idx on housekeeping_responses(item_key);

alter table housekeeping_responses enable row level security;

create policy housekeeping_responses_admin_all on housekeeping_responses for all
  using (current_role_name() = 'admin')
  with check (current_role_name() = 'admin');
