-- Row Level Security policies.
--
-- The Node API uses the Supabase service-role key and enforces authorization
-- itself, so these policies are a defense-in-depth backstop, not the primary
-- authz mechanism. They matter most for the funder role: even if an endpoint
-- had a bug, funders must never be able to select raw participant, response,
-- survey-answer, or communication-log rows through Supabase directly.

-- SECURITY DEFINER is required: this function reads `profiles`, and
-- `profiles` has policies that call this function. Without it, Postgres
-- recurses infinitely evaluating the policy.
create or replace function current_role_name() returns user_role
language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

alter table profiles enable row level security;
alter table participants enable row level security;
alter table checkins enable row level security;
alter table responses enable row level security;
alter table response_tags enable row level security;
alter table surveys enable row level security;
alter table survey_questions enable row level security;
alter table survey_submissions enable row level security;
alter table survey_answers enable row level security;
alter table metrics_snapshots enable row level security;
alter table funder_updates enable row level security;
alter table marketing_campaigns enable row level security;
alter table communication_logs enable row level security;
alter table audit_logs enable row level security;

-- profiles: everyone can read their own; admins read all
create policy profiles_self_select on profiles for select
  using (id = auth.uid() or current_role_name() = 'admin');
create policy profiles_self_update on profiles for update
  using (id = auth.uid()) with check (id = auth.uid() and role = (select role from profiles where id = auth.uid()));
create policy profiles_admin_all on profiles for all
  using (current_role_name() = 'admin');

-- participants: owner + admin only. No funder access.
create policy participants_owner_select on participants for select
  using (profile_id = auth.uid() or current_role_name() = 'admin');
create policy participants_admin_write on participants for insert
  with check (current_role_name() = 'admin');
create policy participants_admin_update on participants for update
  using (current_role_name() = 'admin');
create policy participants_admin_delete on participants for delete
  using (current_role_name() = 'admin');

-- checkins: participant sees their own; admin sees/manages all. No funder access.
create policy checkins_owner_select on checkins for select
  using (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );
create policy checkins_admin_write on checkins for insert
  with check (current_role_name() = 'admin');
create policy checkins_admin_update on checkins for update
  using (current_role_name() = 'admin');

-- responses: participant sees/submits their own; admin sees/manages all. No funder access.
create policy responses_owner_select on responses for select
  using (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );
create policy responses_owner_insert on responses for insert
  with check (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );

-- response_tags: admin only
create policy response_tags_admin_all on response_tags for all
  using (current_role_name() = 'admin');

-- surveys: participants read active surveys; admin manages all. No funder access.
create policy surveys_participant_select on surveys for select
  using (is_active or current_role_name() = 'admin');
create policy surveys_admin_write on surveys for insert
  with check (current_role_name() = 'admin');
create policy surveys_admin_update on surveys for update
  using (current_role_name() = 'admin');
create policy surveys_admin_delete on surveys for delete
  using (current_role_name() = 'admin');

create policy survey_questions_select on survey_questions for select
  using (
    current_role_name() = 'admin'
    or survey_id in (select id from surveys where is_active)
  );
create policy survey_questions_admin_write on survey_questions for all
  using (current_role_name() = 'admin');

-- survey_submissions / survey_answers: owner + admin only. No funder access.
create policy survey_submissions_owner_select on survey_submissions for select
  using (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );
create policy survey_submissions_owner_insert on survey_submissions for insert
  with check (
    current_role_name() = 'admin'
    or participant_id in (select id from participants where profile_id = auth.uid())
  );

create policy survey_answers_owner_select on survey_answers for select
  using (
    current_role_name() = 'admin'
    or submission_id in (
      select id from survey_submissions
      where participant_id in (select id from participants where profile_id = auth.uid())
    )
  );
create policy survey_answers_owner_insert on survey_answers for insert
  with check (
    current_role_name() = 'admin'
    or submission_id in (
      select id from survey_submissions
      where participant_id in (select id from participants where profile_id = auth.uid())
    )
  );

-- metrics_snapshots: admin + funder read; admin writes.
create policy metrics_snapshots_select on metrics_snapshots for select
  using (current_role_name() in ('admin', 'funder'));
create policy metrics_snapshots_admin_write on metrics_snapshots for all
  using (current_role_name() = 'admin');

-- funder_updates: admin + funder read; admin writes.
create policy funder_updates_select on funder_updates for select
  using (current_role_name() in ('admin', 'funder'));
create policy funder_updates_admin_write on funder_updates for insert
  with check (current_role_name() = 'admin');
create policy funder_updates_admin_update on funder_updates for update
  using (current_role_name() = 'admin');

-- marketing_campaigns: admin only. No funder or participant access.
create policy marketing_campaigns_admin_all on marketing_campaigns for all
  using (current_role_name() = 'admin');

-- communication_logs: admin only (participants see comms via checkins/responses instead).
create policy communication_logs_admin_all on communication_logs for all
  using (current_role_name() = 'admin');

-- audit_logs: admin only.
create policy audit_logs_admin_all on audit_logs for all
  using (current_role_name() = 'admin');
