# Monthly Maintenance Checklist

<!-- Comment: run through this once a month even if nothing seems broken —
most of these are the kind of problem that's invisible until it's a P1
(a duplicate Vercel project, a paused database, an expired token). Copy this
checklist into an issue or doc each month and check items off as you go, so
there's a record of when it was last done. -->

**Time budget:** ~15–30 minutes if everything's healthy. Budget more the
first time, or after a long gap since the last pass.

## 1. Deployment health

- [ ] Confirm the site is actually reachable and the last deploy on Vercel
      succeeded (not just "green" — actually open it and click around)
- [ ] **Check for a duplicate Vercel project.** This repo has previously
      had two separate Vercel projects connected simultaneously
      (`program-labs-portal/pgm-labs-portal` and
      `arianna-chozas-projects/pgm-labs-portal`), and the stray one was
      missing environment variables the real one had, which failed a
      deploy. In Vercel, check the GitHub repo's connected integrations —
      there should be exactly one. If there are two, confirm with the
      account owner which is authoritative and disconnect the other.
- [ ] Confirm all five environment variables are still set correctly in the
      *actual* Vercel project (Settings → Environment Variables):
      `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_URL`,
      `SUPABASE_SERVICE_ROLE_KEY`, `HUBSPOT_TOKEN`

## 2. Database

- [ ] Log into the Supabase dashboard and confirm the project is **not
      paused** (free-tier projects pause after a period of inactivity —
      check current Supabase policy, it changes)
- [ ] Check `supabase/migrations/` in the repo against what's actually been
      applied. If the repo has migration files newer than what you last
      applied, run the missing ones (see
      [02-setup-guide.md](./02-setup-guide.md) step 5). This drifts
      whenever a feature branch adds a migration and gets merged without
      anyone also running it against production — it has happened multiple
      times already on this project.
- [ ] Spot-check `audit_logs` for anything unexpected (bulk deletions,
      actions from an unfamiliar `actor_id`, activity outside normal usage
      hours)
- [ ] Check Supabase's usage dashboard against your plan's limits (database
      size, monthly active users, API requests) — a prototype with growing
      real usage can hit free-tier limits without warning

## 3. Seeded / placeholder content

- [ ] If `production-seed-programs.sql` was ever run, check whether the two
      sample upcoming events ("Cohort 11 Info Session," "Quarterly Alumni
      Mixer") are still showing placeholder dates on the live Programs
      page. If real events have been scheduled, update or delete these from
      the admin Programs page — they should not stay as fake data
      indefinitely
- [ ] Check the admin Knowledge Base and Programs pages generally for
      anything that still reads as a placeholder rather than real content

## 4. Access & credentials

- [ ] Confirm the people who should have access (GitHub, Vercel, Supabase,
      HubSpot) still do, and people who shouldn't anymore don't — check this
      especially after any team change
- [ ] If the Supabase `service_role` key or HubSpot token have been shared
      with anyone who's since left, rotate them and update Vercel's env vars
- [ ] Confirm the GitHub repo's default branch protection (if any) still
      matches who should be able to push directly vs. require a PR

## 5. Code health

- [ ] `npm outdated` — see what's behind; you don't need to update
      everything, but note anything with a known security advisory
- [ ] `npm audit` — review, don't blindly `--force` fix (that can bump major
      versions and break things)
- [ ] Check for open feature branches that were never merged — this project
      has a history of branches with real, tested work sitting unmerged for
      a while (e.g. a trailing commit landing just after a PR merged). Merge
      or explicitly abandon them; don't let them silently rot.
- [ ] Skim `git log --oneline -20` on `main` for anything that looks like it
      shipped without the usual build/typecheck verification

## 6. Revisit "what this doesn't do yet"

- [ ] Re-read the gaps list in
      [01-requirements.md](./01-requirements.md#what-this-prototype-does-not-do-yet)
      and `ARCHITECTURE.md`'s "Known gaps" section. If any of them have
      since been built, update those docs so they stop being wrong. Stale
      "not implemented" claims are as misleading as stale "implemented"
      ones.
