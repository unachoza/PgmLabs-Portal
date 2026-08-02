# Requirements

<!-- Comment: this page answers "what do I need before I start," not "how do
I do it" — that's the setup guide. If you're missing something on this page,
go get it before opening 02-setup-guide.md. -->

## Accounts you need

| Account | Why | Cost |
|---|---|---|
| **GitHub** | Hosts the code (`unachoza/PgmLabs-Portal`), triggers deploys | Free for this use |
| **Supabase** | Postgres database + auth | Free tier works for a prototype — see caveats below |
| **Vercel** | Hosts the frontend + serverless API functions | Free/Hobby tier works for a prototype |
| **HubSpot** *(optional)* | Only needed if you're using the CRM contact/company/deal sync feature | Depends on your org's existing HubSpot plan |

You need **write/admin access**, not just a login, to each of these to do
real setup or maintenance work:

- GitHub: write access to the repo (or your own fork, if you're standing up
  an independent copy)
- Supabase: project owner or admin — you'll run SQL migrations directly in
  the dashboard SQL Editor
- Vercel: access to the project that's connected to the repo — **as of this
  writing, verify there's exactly one Vercel project connected.** Two
  separate ones (`program-labs-portal` and `arianna-chozas-projects`, both
  named `pgm-labs-portal`) have been observed connected to the same GitHub
  repo, which caused a real deployment failure once (one project was missing
  environment variables the other had). Confirm with whoever has Vercel
  dashboard access which project is the real one, and disconnect the other's
  GitHub integration if it's stray. See
  [03-monthly-maintenance.md](./03-monthly-maintenance.md) for the recurring
  check.

## Technical prerequisites (local machine)

- **Node.js 20+** and npm (Vite 8 / modern tooling; no `.nvmrc` is committed,
  so this is a recommendation, not an enforced minimum)
- Git
- A terminal — the setup guide is CLI-first
- *(Optional)* [Vercel CLI](https://vercel.com/docs/cli) if you want to run
  the serverless `/api` functions locally with `vercel dev` instead of just
  the frontend with `vite`

## What this prototype does NOT do yet

Read this before you promise it to anyone — these are real, current gaps,
not hypotheticals:

- **No automated tests.** `ARCHITECTURE.md` names the two highest-value
  tests that don't exist yet (RLS policy enforcement, funder-anonymization
  boundary). Nothing currently guards against a regression in either.
- **No real email delivery.** Every "Send" action in the app (funder
  updates, marketing campaigns, the housekeeping follow-up emails) *logs*
  the action to `communication_logs` with a timestamp — it does not call an
  email provider. Nothing is actually emailed to anyone.
- **No live accounting integration.** The Cohort Financials feature and
  `/api/accounting/sync` currently return a hardcoded sample P&L report
  (`TRIPLETEX_SAMPLE_REPORT`), not a real OAuth pull from QuickBooks, Xero,
  or Tripletex, despite `.env.example` listing credentials for those
  providers. The one exception noted in `PRODUCT.md` — a real Tripletex pull
  for a specific company — was a one-off proof of the mechanism, not
  something wired into the app's normal flow.
- **No scheduled jobs.** Check-in `overdue` status doesn't flip
  automatically when a due date passes — it's only set at seed time.
  Recurring surveys don't proactively re-send; a participant just becomes
  eligible to resubmit again once their survey's recurrence window elapses.
  Nothing runs on a cron.
- **Supabase free tier pauses inactive projects.** If nobody hits the
  database for ~1 week (check current Supabase policy — this changes), the
  project pauses and the app goes down until someone unpauses it in the
  Supabase dashboard. Fine for a prototype under active development; not
  fine to hand to a funder without warning them.

None of this is a defect to panic about — it's the actual, current state,
and it's better that whoever inherits this knows it up front than discovers
it live.
