# Setup Guide

<!-- Comment: each step says what it does and why, not just the command to
run — if a step fails, you should be able to tell whether it's safe to
re-run, skip, or whether you need to stop and ask someone. -->

Follow this in order. Steps 1–3 get you running against fake data with no
external accounts. Steps 4+ get you a real, persistent Supabase-backed
deployment.

## 1. Clone and install

```bash
git clone https://github.com/unachoza/PgmLabs-Portal.git
cd PgmLabs-Portal
npm install
```

## 2. Try it in mock mode (no accounts needed)

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). In development,
the app defaults to **mock mode**: fake in-memory data and fake auth, no
Supabase project required. Seeded logins (password `Passw0rd!` for all):

- `admin@accelerator.dev` — administrator
- `funder@accelerator.dev` — funder
- `amara.okafor@participant.dev`, `diego.alvarez@participant.dev`,
  `priya.singh@participant.dev` — participants

Mock mode is genuinely useful for a first look or for UI changes, but it
resets every time you reload the page — nothing you create persists. Move
past this once you want real data.

## 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com), create a project (free tier
   is fine for a prototype).
2. From **Project Settings → API**, collect three values you'll need next:
   - **Project URL**
   - **anon / public key**
   - **service_role key** — treat this like a root password. It bypasses
     row-level security. Never put it in a `VITE_`-prefixed variable or
     anything that ships to the browser.

## 4. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Value | Used by |
|---|---|---|
| `VITE_SUPABASE_URL` | Supabase Project URL | Browser (safe to expose) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key | Browser (safe to expose — RLS-protected) |
| `VITE_AUTH_MODE` | `real` | Set this to leave mock mode and use live Supabase auth |
| `SUPABASE_URL` | Same Supabase Project URL | Server only (Vercel functions) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | Server only — **never expose to the browser** |
| `HUBSPOT_TOKEN` | HubSpot private app token | Only needed for the HubSpot sync script — see below |

The accounting-provider variables listed further down in `.env.example`
(`QBO_CLIENT_ID`, `XERO_CLIENT_ID`, `TRIPLETEX_*`, `ACCOUNTING_TOKEN_ENC_KEY`)
are **not used by any code path today** — see
[01-requirements.md](./01-requirements.md) for why. Leave them unset unless
you're actively building that integration.

### If you want HubSpot sync

1. In HubSpot, create a **private app**.
2. Grant read scopes: `crm.objects.contacts.read`,
   `crm.objects.companies.read`, `crm.objects.deals.read`,
   `crm.objects.tickets.read`.
3. Put the generated token in `HUBSPOT_TOKEN`.

## 5. Apply the database schema

Run every file in `supabase/migrations/` **in filename order** against your
Supabase project. Easiest path: open the Supabase dashboard's **SQL Editor**,
paste each file's contents, and run it.

```
001_init.sql                          # core tables, enums, indexes
002_rls.sql                           # row-level security policies
003_accounting.sql                    # accounting integration tables
003_hubspot.sql                       # HubSpot CRM sync tables (order vs 003_accounting doesn't matter — no dependency between them)
004_profiles_signup.sql               # self-registration profile fields
005_knowledge_base.sql                # admin knowledge base
006_housekeeping.sql                  # admin housekeeping agent
007_program_events.sql                # funder-facing Programs page
008_participant_profile_details.sql   # participant self-edit profile + milestones
```

If you have the Supabase CLI linked to the project instead, `supabase db
push` applies pending migrations from this folder automatically — check
`supabase migration list` first to see what's already applied so you don't
duplicate work.

**If a migration fails with "relation already exists"** — it's already
applied, skip it and move to the next file. That's the single most common
error you'll hit re-running this against a project that already has some
history (see `production-seed-programs.sql`'s comments for the same pattern
applied to seed data).

## 6. Seed data

Two different things live under `supabase/`, and they are **not**
interchangeable:

### `seed.sql` — local/dev only, do not run against a real production database

Creates fake `auth.users` directly (admin, funder, 15 participants,
password `Passw0rd!` for all) plus sample check-ins, responses, surveys,
metrics, funder updates, campaigns, knowledge base articles, and program
events. **This is not safe to re-run** against a database that already has
this data — it'll hit duplicate-key errors on the second run, because the
core participant-seeding block has no conflict handling.

```
supabase/seed.sql
```

### `production-seed-*.sql` — safe for a real database with real users

Two standalone, idempotent scripts that seed *content* (not test users)
into a database that already has a real admin account:

```
supabase/production-seed-knowledge-base.sql
supabase/production-seed-programs.sql
```

Both look up an admin by email — **open the file first and replace the
placeholder email with a real admin's login email** before running — and
guard every insert so re-running them is harmless. Use these instead of
`seed.sql` once real users exist in the project.

## 7. Run locally against the real Supabase project

With `VITE_AUTH_MODE=real` set in `.env`:

```bash
npm run dev
```

To also exercise the `/api/*` serverless functions locally (participant
edits, survey submissions, admin actions — anything that isn't a static
page), you need the Vercel CLI, which runs frontend + API together:

```bash
npm i -g vercel   # if you don't have it
vercel dev
```

## 8. Deploy to Vercel

1. Import the GitHub repo into Vercel ([vercel.com/new](https://vercel.com/new)).
2. **Before deploying, verify you're not creating a second, duplicate
   project** for this repo — see the callout in
   [01-requirements.md](./01-requirements.md). If a Vercel project already
   exists for this repo, use that one.
3. In the project's **Settings → Environment Variables**, set all five app
   variables from step 4 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
   `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `HUBSPOT_TOKEN` if
   you're using sync). The two `VITE_` ones are build-time; the rest are
   runtime-only for the serverless functions.
4. Push to the branch Vercel is watching (usually `main`) — it builds and
   deploys automatically on every push.

## 9. Verify it actually works

Don't call it done on a green build alone — a missing env var or an
unapplied migration both build fine and fail at runtime.

- [ ] Log in as admin, participant, and funder (real accounts, not the mock
      seeded ones) and confirm each role's nav/pages load without a "table
      not found" or 401/403 error
- [ ] As admin, create one of each: a check-in, a survey, a knowledge base
      article, a program event — confirms writes work, not just reads
      (writes are where a missing service-role key or unapplied migration
      shows up)
- [ ] As a participant, submit a survey and edit your profile
- [ ] As a funder, load the Programs page and confirm the Cohort
      Achievements and Resource Center Activity panels show real numbers,
      not the empty state

## Handing off access

When ownership changes hands, transfer or grant on all four accounts from
[01-requirements.md](./01-requirements.md) — GitHub, Supabase, Vercel,
HubSpot — don't just hand over a written doc. After the transfer:

- [ ] Rotate the Supabase `service_role` key and update it in Vercel's env
      vars (anyone who had the old key can bypass RLS indefinitely
      otherwise)
- [ ] Rotate the HubSpot private app token, if it was ever shared outside
      the new owner
- [ ] Confirm the new owner can actually log into the Supabase dashboard,
      Vercel dashboard, and push to the GitHub repo — a broken invite is
      the most common handover failure
- [ ] Walk the new owner through [01-requirements.md](./01-requirements.md)'s
      "what this doesn't do yet" list out loud — don't let them find out
      from a support ticket
