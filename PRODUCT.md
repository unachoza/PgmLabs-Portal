# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

- **Frontend:** React 19 + Vite + TypeScript, with React Router and zod. This is
  the authoritative implementation on `main`.
- **Backend:** Supabase, accessed through a Vercel-style serverless `api/` layer
  (participants, check-ins, surveys, responses, metrics, campaigns,
  funder-updates, CSV export).

This resolved in code: PR #3 merged the full React + Supabase portal, and the
earlier Node/Express + SQLite prototype (`feature/miguel`, PR #2) was closed and
superseded — it is historical context only, not a live reference.

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
- Data model and role flows are implemented on `main` (React frontend +
  Supabase-backed `api/` layer).

## Capabilities and Constraints

Confirmed functionality (implemented on `main`: React feature pages for all three
roles plus the serverless `api/` layer):

- Role-based dashboards for admin / participant / funder (auth context +
  protected routes; Supabase-backed auth).
- Check-ins (admin→participant outreach) and participant responses.
- Surveys: questions, submissions, answers, active/inactive state.
- Aggregate metrics endpoint computing cohort KPIs; CSV export for reporting.
- Funder updates and marketing campaigns.
- Funder endpoints are aggregate-only by design — no raw participant records.

Financial integration:

- Automatic P&L pull demonstrated via Tripletex integration; documented in
  `docs/accounting-partnership-idea.md`.
- **Single-company scoping is a hard constraint:** one accounting API key reaches
  one company's books. Multi-company access model (accountant-firm setup vs.
  per-company OAuth) is undecided and must be resolved before a cohort-wide
  dashboard is promised.

Terminology: cohort, participant, funder, check-in, funder update, campaign.

## Brand Commitments

- Product name: **Program Labs Portal** (repo `PgmLabs-Portal`); hackathon team
  **ProgramLabs4Life**.
- Notion knowledge base titled **Program Labs 4 Life** (internal link).
- No confirmed logo, brand palette, typography, or voice guidelines exist yet —
  future visual work must not invent these as if they were binding; a visual
  world is chosen later in new-work.

## Evidence on Hand

- `docs/accounting-partnership-idea.md` — partnership concept and proof-of-concept
  write-up.
- **Proof the mechanism works:** live July 2026 P&L pulled for a real company
  (Førstehjelperen AS) via the Tripletex integration.
- Working portal on `main` — React feature pages for all three roles plus a
  Supabase-backed `api/` layer (PR #3).
- Notion knowledge base: "Program Labs 4 Life" (private/internal link).
- Real stakeholder contact: Aaron @ Intuit (exploratory conversation; no
  commitment secured yet).
- Post-hackathon maintenance commitments: Uma (2h/month) and Sergey (2h/month).
- No public testimonials, named customers, pricing, licensing, deployment, or
  benchmark claims exist — future work must not fabricate them.

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
