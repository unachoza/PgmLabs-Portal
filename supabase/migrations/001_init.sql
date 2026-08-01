-- Accelerator Portal — initial schema
-- Postgres/Supabase. Auth identities live in auth.users; profiles extends them.

create extension if not exists "pgcrypto" with schema public;

create type user_role as enum ('participant', 'admin', 'funder');
create type checkin_status as enum ('sent', 'responded', 'overdue');
create type campaign_status as enum ('draft', 'sent');
create type response_tag as enum ('growth', 'hiring', 'funding', 'risk', 'other');

-- Profiles -------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role user_role not null default 'participant',
  created_at timestamptz not null default now()
);

-- Participants -----------------------------------------------------------

create table participants (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references profiles(id) on delete cascade,
  cohort text not null,
  company_name text,
  industry text,
  joined_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'graduated', 'paused', 'withdrawn'))
);

create index participants_cohort_idx on participants(cohort);

-- Check-ins & responses --------------------------------------------------

create table checkins (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  subject text not null,
  message text not null,
  sent_by uuid not null references profiles(id) on delete cascade,
  sent_at timestamptz not null default now(),
  due_at timestamptz,
  status checkin_status not null default 'sent'
);

create index checkins_participant_idx on checkins(participant_id);
create index checkins_status_idx on checkins(status);

create table responses (
  id uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references checkins(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  payload_json jsonb not null,
  submitted_at timestamptz not null default now()
);

create index responses_participant_idx on responses(participant_id);

create table response_tags (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references responses(id) on delete cascade,
  tag response_tag not null,
  unique (response_id, tag)
);

-- Surveys ------------------------------------------------------------------

create table surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  is_active boolean not null default true,
  recurrence text check (recurrence in ('none', 'weekly', 'monthly', 'quarterly')) default 'none'
);

create table survey_questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  question_text text not null,
  question_type text not null check (question_type in ('text', 'number', 'select', 'multiselect', 'boolean')),
  required boolean not null default false,
  sort_order integer not null default 0
);

create index survey_questions_survey_idx on survey_questions(survey_id);

create table survey_submissions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references surveys(id) on delete cascade,
  participant_id uuid not null references participants(id) on delete cascade,
  submitted_at timestamptz not null default now()
);

create table survey_answers (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references survey_submissions(id) on delete cascade,
  question_id uuid not null references survey_questions(id) on delete cascade,
  answer_text text not null
);

-- Metrics & funder-facing content -----------------------------------------

create table metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  cohort text,
  period_start date,
  period_end date,
  metric_key text not null,
  metric_value numeric not null,
  captured_at timestamptz not null default now()
);

create index metrics_snapshots_key_idx on metrics_snapshots(metric_key);
create index metrics_snapshots_period_idx on metrics_snapshots(period_start, period_end);

create table funder_updates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null,
  audience text not null,
  sent_by uuid not null references profiles(id) on delete cascade,
  sent_at timestamptz not null default now(),
  follow_up_status text not null default 'none' check (follow_up_status in ('none', 'pending', 'complete'))
);

-- Marketing & comms audit ---------------------------------------------------

create table marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  audience_segment text not null,
  created_by uuid not null references profiles(id) on delete cascade,
  sent_at timestamptz,
  status campaign_status not null default 'draft'
);

create table communication_logs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('participant', 'funder', 'campaign')),
  entity_id uuid not null,
  channel text not null check (channel in ('email', 'sms', 'in_app')),
  direction text not null check (direction in ('outbound', 'inbound')),
  subject text,
  body text,
  created_by uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  created_at timestamptz not null default now()
);
