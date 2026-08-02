-- One-time production seed for the knowledge base's initial conference-strategy
-- content. Safe to run standalone (does not touch auth.users, unlike seed.sql).
--
-- Before running: replace the email below with a real admin account's email.
-- Run this AFTER supabase/migrations/005_knowledge_base.sql has been applied.

do $$
declare
  admin_id uuid;
begin
  select id into admin_id from profiles where email = 'admin@example.com' and role = 'admin';

  if admin_id is null then
    raise exception 'No admin profile found for that email — update the email in this script first.';
  end if;

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
