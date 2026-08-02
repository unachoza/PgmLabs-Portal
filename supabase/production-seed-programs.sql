-- One-time production seed for the Programs page (events + KPIs).
-- Safe to run standalone and safe to re-run — does NOT touch
-- auth.users/profiles/participants, and every insert is guarded so it
-- won't create duplicates if it's run more than once.
--
-- Before running: replace the email below with a real admin account's email.
-- Run this AFTER supabase/migrations/007_program_events.sql has been applied
-- (if you already see "relation program_events already exists", that
-- migration is already applied — just proceed with this script).

do $$
declare
  admin_id uuid;
  cohort10_event_id uuid;
begin
  select id into admin_id from profiles where email = 'admin@example.com' and role = 'admin';

  if admin_id is null then
    raise exception 'No admin profile found for that email — update the email in this script first.';
  end if;

  -- Cohort 10 Graduation (past event) + its achievement KPIs
  select id into cohort10_event_id from program_events where title = 'Cohort 10 Graduation';

  if cohort10_event_id is null then
    insert into program_events (title, description, event_type, event_date, cohort, location, created_by)
    values (
      'Cohort 10 Graduation',
      'Inaugural SDCCE Accelerator cohort graduation — 10 companies completed the free 4-month program covering sales, finance, marketing, and business model, with small-group mentoring and weekly check-ins.',
      'past',
      '2025-11-20',
      'Cohort 10',
      'Barrio Logan, San Diego',
      admin_id
    )
    returning id into cohort10_event_id;

    insert into program_kpis (panel, event_id, label, value, sort_order, created_by)
    values
      ('cohort_achievements', cohort10_event_id, 'Cohort Companies', '10', 1, admin_id),
      ('cohort_achievements', cohort10_event_id, 'Hours of 1-on-1 Coaching', '82', 2, admin_id),
      ('cohort_achievements', cohort10_event_id, 'Increased Revenue During Program', '30%', 3, admin_id),
      ('cohort_achievements', cohort10_event_id, 'Founders Reported Increase in Confidence', '100%', 4, admin_id);
  end if;

  -- Business Resource Center Activity KPIs (standalone, period-based, not tied to a cohort)
  if not exists (select 1 from program_kpis where panel = 'resource_center_activity' and label = 'Technical Assistance Sessions') then
    insert into program_kpis (panel, event_id, label, value, period_label, sort_order, created_by)
    values
      ('resource_center_activity', null, 'Technical Assistance Sessions', '61', 'May - Dec 2025', 1, admin_id),
      ('resource_center_activity', null, 'Community Workshops', '11', 'May - Dec 2025', 2, admin_id),
      ('resource_center_activity', null, 'Unique Visitors', '132', 'May - Dec 2025', 3, admin_id),
      ('resource_center_activity', null, 'Repeat Visitors', '26%', 'May - Dec 2025', 4, admin_id),
      ('resource_center_activity', null, 'Workshops Facilitated By Alumni', '9', 'May - Dec 2025', 5, admin_id);
  end if;

  -- Sample placeholder upcoming events — real dates unknown, correct these
  -- from the admin Programs page once actual events are scheduled.
  if not exists (select 1 from program_events where title = 'Cohort 11 Info Session') then
    insert into program_events (title, description, event_type, event_date, cohort, location, created_by)
    values (
      'Cohort 11 Info Session',
      'Sample placeholder — replace with the real date. Applications open for the next free 4-month Accelerator cohort; info session covers eligibility, timeline, and what the program includes.',
      'upcoming',
      '2026-09-10',
      'Cohort 11',
      'Barrio Logan, San Diego',
      admin_id
    );
  end if;

  if not exists (select 1 from program_events where title = 'Quarterly Alumni Mixer') then
    insert into program_events (title, description, event_type, event_date, cohort, location, created_by)
    values (
      'Quarterly Alumni Mixer',
      'Sample placeholder — replace with the real date. Networking mixer for Accelerator alumni, part of the Alumni Network''s quarterly cadence.',
      'upcoming',
      '2026-10-15',
      null,
      'Barrio Logan, San Diego',
      admin_id
    );
  end if;
end $$;
