# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 + Vite + TypeScript frontend, Supabase (Postgres + Auth) as the
database, and a Vercel serverless-functions backend (Node/TypeScript). This is
built and merged to `main` — role-based dashboards, check-ins, surveys,
metrics, funder updates, and marketing campaigns are implemented and running,
not just scaffolded.

The `feature/miguel` branch (Node/Express + SQLite + vanilla JS, JWT auth)
remains on record as the original data-model reference the shipped schema was
adapted from.

## Users

Three roles, served role-based with no single primary user:

- **Program admins / staff** — Program Labs team running the cohort: manage
  participants, send check-ins, review responses, publish funder updates, run
  marketing campaigns.
- **Cohort founders (participants)** — founders in the program: view their
  profile, respond to check-ins, submit survey responses, see their own progress.
- **Funders / donors** — view aggregate impact metrics and funder updates;
  deliberately not exposed to raw participant-level records.

## Product Purpose

Program Labs Portal ("PgmLabs-Portal") is an **impact-tracking portal for a
nonprofit accelerator** that runs cohorts of founders/companies. It tracks
participant progress through check-ins and surveys, aggregates cohort KPIs, and
communicates verified impact to funders. Success = the program can prove, with
trustworthy current data, how its cohort companies are actually doing — without
chasing founders for spreadsheets.

## Positioning

**Automatic financial tracking.** The portal pulls cohort companies' real
financials automatically through accounting integrations (QuickBooks/Intuit,
Xero, Tripletex) instead of relying on manual, self-reported numbers. That
turns impact reporting from a late, unverifiable survey exercise into live,
verified data — a claim a generic "nonprofit CRM" cannot truthfully make. The
mechanism is proven, not aspirational: a live July P&L was pulled for a real
company via the Tripletex integration during the hackathon.

## Operating Context

- **Admin workflow:** onboard participants → send check-ins → review responses →
  compute/aggregate metrics → publish funder updates → run marketing campaigns.
- **Participant workflow:** log in → view check-ins → submit responses → take
  active surveys.
- **Funder workflow:** log in → view aggregate KPIs and funder updates.
- **Financial-tracking loop (positioning):** founder authorizes read-only access
  to their books → scheduled pull normalizes each company's P&L → cohort
  dashboard + funder-ready reports. Access is explicit, read-only, and revocable.
- Built at the Social Impact HackAIthon — San Diego (team ProgramLabs4Life).

## Capabilities and Constraints

Confirmed functionality, shipped and running on `main`:

- Role-based dashboards for admin / participant / funder (React + Vite + TS).
- Supabase Auth + role/least-privilege checks enforced in Vercel serverless
  functions.
- Check-ins (admin→participant outreach) and participant responses (JSON payload).
- Surveys: questions, submissions, answers, active/inactive state.
- Aggregate metrics endpoint computing cohort KPIs; CSV export for reporting.
- Funder updates and marketing campaigns; communication logs.
- Funder endpoints are aggregate-only by design — no raw participant records.
- HubSpot CRM integration — sync functionality for contacts/companies/deals
  with configurable environment credentials (built by Uma).
- Portal deployed to Vercel production.

Financial integration:

- Live QuickBooks/Tripletex P&L pull, with a **Cohort Financials** dashboard
  view surfacing pulled data alongside the rest of the admin portal.
- **Single-company scoping is a hard constraint:** one accounting API key reaches
  one company's books. Multi-company access model (accountant-firm setup vs.
  per-company OAuth) is undecided and must be resolved before a cohort-wide
  dashboard is promised. *(Status as of this writing: still open — not yet
  confirmed resolved or unresolved by the team.)*

Terminology: cohort, participant, funder, check-in, funder update, campaign.

## Brand Commitments

- Product name: **Program Labs Portal** (repo `PgmLabs-Portal`); hackathon team
  **ProgramLabs4Life**.
- Notion knowledge base titled **Program Labs 4 Life** (internal link).
- No confirmed logo, brand palette, typography, or voice guidelines exist yet —
  future visual work must not invent these as if they were binding; a visual
  world is chosen later in new-work.

## Evidence on Hand

- **Portal deployed to Vercel production** — the React/Supabase/Vercel-functions
  build described under Stack, live and running, not just a demo build.
- `docs/accounting-partnership-idea.md` — partnership concept and proof-of-concept
  write-up.
- **Proof the mechanism works:** live July 2026 P&L pulled for a real company
  (Førstehjelperen AS) via the Tripletex integration, surfaced in the portal's
  Cohort Financials view.
- HubSpot CRM integration — sync functionality live in the portal.
- `feature/miguel` branch — original working prototype + seed dataset the
  shipped schema was adapted from.
- Notion knowledge base: "Program Labs 4 Life" (private/internal link).
- Real stakeholder contact: Aaron @ Intuit (exploratory conversation; no
  commitment secured yet).
- Post-hackathon maintenance commitments: Uma (2h/month) and Sergey (2h/month).
- No public testimonials, named customers, pricing, licensing, or benchmark
  claims exist — future work must not fabricate them.

## Product Principles

1. **Verified over self-reported.** Pull real data automatically; don't make
   founders retype numbers, and don't present guesses as facts.
2. **Three audiences, one portal, no confusion.** Role-based views; funders see
   aggregates, participants see their own data, admins orchestrate.
3. **Low founder friction.** After one-time authorization, tracking is automatic
   — no recurring data-request nagging.
4. **Trust is the product.** Consent, privacy, and least-privilege access to
   sensitive financials are first-class, not afterthoughts.
5. **Survive the hackathon.** Favor durable, maintainable, genuinely-working
   over demo-only — the solution is committed to run past the weekend.
