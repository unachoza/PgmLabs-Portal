-- Seed data for local/dev environments.
-- Creates auth.users directly (local/dev only) so seeded accounts can log in
-- with the password below via Supabase Auth. Do NOT run against production.
--
-- Default password for every seeded account: "Passw0rd!"

do $$
declare
  admin_id uuid := 'a0000000-0000-0000-0000-000000000001';
  funder_id uuid := 'a0000000-0000-0000-0000-000000000002';
  p_ids uuid[] := array[
    'b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000003','b0000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000005','b0000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000007','b0000000-0000-0000-0000-000000000008',
    'b0000000-0000-0000-0000-000000000009','b0000000-0000-0000-0000-000000000010',
    'b0000000-0000-0000-0000-000000000011','b0000000-0000-0000-0000-000000000012',
    'b0000000-0000-0000-0000-000000000013','b0000000-0000-0000-0000-000000000014',
    'b0000000-0000-0000-0000-000000000015'
  ];
  names text[] := array[
    'Amara Okafor','Liam Chen','Priya Nair','Diego Ramirez','Sofia Rossi',
    'Kwame Mensah','Yuki Tanaka','Fatima Zahra','Noah Fischer','Elena Petrova',
    'Carlos Mendes','Grace Kim','Tariq Aziz','Ines Duarte','Mateo Silva'
  ];
  companies text[] := array[
    'Verdant Foods','Loopline Logistics','Nairobi Fintech Co','Ramirez Robotics','Rossi Textiles',
    'Mensah Solar','Tanaka Analytics','Zahra Health','Fischer Freight','Petrova Biotech',
    'Mendes AgriTech','Kim Craft Goods','Aziz Mobility','Duarte Media','Silva Water Systems'
  ];
  industries text[] := array[
    'Food & Beverage','Logistics','Fintech','Robotics','Manufacturing',
    'Clean Energy','Data & Analytics','Healthcare','Logistics','Biotech',
    'Agriculture','Retail','Mobility','Media','Water & Sanitation'
  ];
  cohorts text[] := array['2025-Spring','2025-Fall','2026-Spring'];
  part_ids uuid[] := array[]::uuid[];
  cs1 uuid; cs2 uuid; cs3 uuid;
  survey1 uuid;
  q1 uuid; q2 uuid; q3 uuid;
  sub1 uuid;
  resp1 uuid;
  i int;
  pid uuid;
  new_part_id uuid;
begin
  -- auth.users: admin + funder + 15 participants
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
  values
    ('00000000-0000-0000-0000-000000000000', admin_id, 'authenticated', 'authenticated', 'admin@accelerator.dev', crypt('Passw0rd!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}'),
    ('00000000-0000-0000-0000-000000000000', funder_id, 'authenticated', 'authenticated', 'funder@accelerator.dev', crypt('Passw0rd!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}')
  on conflict (id) do nothing;

  insert into profiles (id, name, email, role)
  values
    (admin_id, 'Jordan Blake', 'admin@accelerator.dev', 'admin'),
    (funder_id, 'Riverstone Capital', 'funder@accelerator.dev', 'funder')
  on conflict (id) do nothing;

  for i in 1..array_length(p_ids, 1) loop
    pid := p_ids[i];
    insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
    values ('00000000-0000-0000-0000-000000000000', pid, 'authenticated', 'authenticated',
            lower(replace(names[i], ' ', '.')) || '@participant.dev',
            crypt('Passw0rd!', gen_salt('bf')), now(), now(), now(),
            '{"provider":"email","providers":["email"]}', '{}')
    on conflict (id) do nothing;

    insert into profiles (id, name, email, role)
    values (pid, names[i], lower(replace(names[i], ' ', '.')) || '@participant.dev', 'participant')
    on conflict (id) do nothing;

    insert into participants (profile_id, cohort, company_name, industry, status)
    values (pid, cohorts[((i - 1) % 3) + 1], companies[i], industries[i], 'active')
    returning id into new_part_id;

    part_ids := array_append(part_ids, new_part_id);
  end loop;

  -- Check-ins + responses for the first three participants
  insert into checkins (participant_id, subject, message, sent_by, due_at, status)
  values (part_ids[1], 'Q1 milestone check-in', 'How is revenue tracking against your Q1 target?', admin_id, now() + interval '7 days', 'responded')
  returning id into cs1;

  insert into checkins (participant_id, subject, message, sent_by, due_at, status)
  values (part_ids[2], 'Hiring update', 'Any new hires or open roles this month?', admin_id, now() + interval '7 days', 'sent')
  returning id into cs2;

  insert into checkins (participant_id, subject, message, sent_by, due_at, status)
  values (part_ids[3], 'Funding round status', 'Any updates on your raise?', admin_id, now() - interval '2 days', 'overdue')
  returning id into cs3;

  insert into responses (checkin_id, participant_id, payload_json)
  values (cs1, part_ids[1], '{"revenue_band": "50k-100k", "jobs_created": 3, "challenges": "Hiring senior engineers"}'::jsonb)
  returning id into resp1;

  insert into response_tags (response_id, tag) values (resp1, 'growth'), (resp1, 'hiring');

  -- Survey
  insert into surveys (title, description, created_by, is_active, recurrence)
  values ('Quarterly Progress Survey', 'Standard quarterly outcomes survey', admin_id, true, 'quarterly')
  returning id into survey1;

  insert into survey_questions (survey_id, question_text, question_type, required, sort_order)
  values
    (survey1, 'What revenue band best describes last quarter?', 'select', true, 1),
    (survey1, 'How many jobs did you create this quarter?', 'number', true, 2),
    (survey1, 'What support do you need most right now?', 'text', false, 3);

  select id into q1 from survey_questions where survey_id = survey1 and sort_order = 1;
  select id into q2 from survey_questions where survey_id = survey1 and sort_order = 2;
  select id into q3 from survey_questions where survey_id = survey1 and sort_order = 3;

  insert into survey_submissions (survey_id, participant_id) values (survey1, part_ids[1]) returning id into sub1;
  insert into survey_answers (submission_id, question_id, answer_text)
  values (sub1, q1, '50k-100k'), (sub1, q2, '3'), (sub1, q3, 'Intro to enterprise customers');

  -- Metrics snapshots (aggregate, funder-visible)
  insert into metrics_snapshots (cohort, period_start, period_end, metric_key, metric_value)
  values
    ('2025-Spring', '2025-01-01', '2025-03-31', 'active_participants', 5),
    ('2025-Spring', '2025-01-01', '2025-03-31', 'jobs_created', 22),
    ('2025-Spring', '2025-01-01', '2025-03-31', 'capital_raised_usd', 480000),
    ('2025-Fall', '2025-04-01', '2025-06-30', 'active_participants', 5),
    ('2025-Fall', '2025-04-01', '2025-06-30', 'jobs_created', 31),
    ('2025-Fall', '2025-04-01', '2025-06-30', 'capital_raised_usd', 725000),
    ('2026-Spring', '2025-07-01', '2025-09-30', 'active_participants', 5),
    ('2026-Spring', '2025-07-01', '2025-09-30', 'jobs_created', 18),
    ('2026-Spring', '2025-07-01', '2025-09-30', 'capital_raised_usd', 310000);

  -- Funder updates
  insert into funder_updates (title, summary, audience, sent_by, follow_up_status)
  values
    ('Q3 Impact Summary', 'Program-wide outcomes for Q3: 5 active cohorts, 31 jobs created, $725k capital raised.', 'all_funders', admin_id, 'none'),
    ('Riverstone Capital check-in', 'Follow-up on portfolio company introductions requested last quarter.', 'Riverstone Capital', admin_id, 'pending');

  -- Marketing campaigns
  insert into marketing_campaigns (title, content, audience_segment, created_by, status, sent_at)
  values
    ('Spring Cohort Applications Open', 'Applications for the 2026 Spring cohort are now open. Apply by March 1.', 'prospects', admin_id, 'sent', now() - interval '10 days'),
    ('Alumni Success Spotlight', 'Draft newsletter spotlighting alumni milestones this quarter.', 'alumni', admin_id, 'draft', null);

  -- Communication log + audit sample
  insert into communication_logs (entity_type, entity_id, channel, direction, subject, body, created_by)
  values (
    'funder', funder_id, 'email', 'outbound', 'Q3 Impact Summary sent',
    'Sent the Q3 impact summary to Riverstone Capital.', admin_id
  );

  insert into audit_logs (actor_id, action, entity_type, entity_id)
  values (admin_id, 'checkin_sent', 'checkin', cs1);
end $$;

-- Knowledge base seed: conference strategy reference material for admin.
do $$
declare
  admin_id uuid := 'a0000000-0000-0000-0000-000000000001';
begin
  insert into knowledge_base_articles (category, title, content, created_by)
  values (
    'Strategy for Alex at Conferences',
    'FAQ Questions Across Conferences',
    $c$1. What challenge are you addressing? (Why does this issue matter now? What problem exists)
2. What is your approach or innovation? (What makes your framework, model, research, or program different)
3. What evidence shows it works? (Data, evaluation, outcomes, participant stories)
4. What will participants actually learn? (3–5 learning objectives or takeaways)
5. What practical tools will attendees leave with? (templates, worksheets, implementation guides)
6. How will the session engage participants? (Discussion, workshop, exercises, case studies)
7. How does this advance equity or systems change? (Inclusion, community voice, equitable outcomes, policy impact or policy implications)
8. Why is this timely? (Why should this conversation happen this year?)
9. Why are you credible on this topic (bio and success story)$c$,
    admin_id
  );

  insert into knowledge_base_articles (category, title, content, created_by)
  values (
    'Strategy for Alex at Conferences',
    'Deck Ideas',
    $c$What future are we preparing communities for?
What problems are traditional entrepreneurship ecosystems failing to solve?
What is the Program Labs methodology?
How does the methodology work?
Where has it been implemented?
What evidence demonstrates impact?
How can organizations adapt the framework?
What tools do attendees receive?
How do funders, ecosystem builders, and practitioners use it?
What comes next?$c$,
    admin_id
  );

  insert into knowledge_base_articles (category, title, content, links, created_by)
  values (
    'Strategy for Alex at Conferences',
    'National Conference Strategy',
    'Reference links for identifying and submitting to national conferences.',
    jsonb_build_array(
      jsonb_build_object('label', 'List of national conferences', 'url', 'https://docs.google.com/spreadsheets/d/1MC1_xkTKkujX0DVMr13fX7j7R3IegkcJsu8_-wqft5s/edit?gid=0#gid=0'),
      jsonb_build_object('label', 'Submit proposal today', 'url', 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=jBWA57bSEUeH_iNHkb7y_5LEhaEuqfpGqQPwyUuGI-FUNEVVQklRWE9JQldIOTA5R0kwU1AxTE5TVS4u&origin=Invitation&channel=0'),
      jsonb_build_object('label', 'The Forum 2027 (NAWB)', 'url', 'https://www.nawb.org/the-forum-2027/'),
      jsonb_build_object('label', 'Submit Proposal (need login created)', 'url', 'https://whova.com/call_for_speakers/pdjptEzHL9d-zJ-vpHxU4n4a0ouJq2l%40jpwEqS05tFwPTz6C4KTR27TctRb31dHr/'),
      jsonb_build_object('label', 'Details for Funding', 'url', 'https://drive.google.com/file/d/1EfJjAsfdJkzxSXr7EpnYcAcGDy6XcEAx/view?usp=sharing')
    ),
    admin_id
  );
end $$;
