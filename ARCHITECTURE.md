# Architecture Notes

## Shape

```
Browser (React + TS)
  │  Supabase Auth (anon key) — sign in/out, session, JWT
  │  fetch /api/* with Authorization: Bearer <jwt>
  ▼
Vercel Serverless Functions (Node + TS)
  │  requireRole() verifies JWT, loads profiles.role, authorizes
  │  supabaseAdmin (service-role key) executes the query
  ▼
Supabase / Postgres  — RLS enabled as a backstop
```

The browser never queries Postgres directly. `src/lib/supabaseClient.ts` exists only for auth; all data access goes through `src/lib/apiClient.ts` → `/api`.

## Authorization model

The API uses the **service-role key**, which bypasses RLS. That makes `api/_lib/auth.ts::requireRole()` the real enforcement point — every handler calls it before touching data, and every handler declares which roles it accepts.

RLS policies (`supabase/migrations/002_rls.sql`) are still enabled and still meaningful: they're a second layer that limits the damage if an endpoint has an authorization bug or if the anon key is ever used for direct queries. The policies deliberately grant funders **no** access to `participants`, `responses`, `survey_answers`, `survey_submissions`, `communication_logs`, or `marketing_campaigns`.

### Why role isn't editable by users

`profiles.role` drives every authorization decision. The `profiles_self_update` policy re-checks that the submitted `role` matches the caller's existing role, the intent being that a participant cannot promote themselves to admin by updating their own profile row. **This is untested and load-bearing** — it should be the first RLS test written.

`current_role_name()` is `SECURITY DEFINER` because it reads `profiles`, and `profiles` has policies that call it; without that, policy evaluation recurses infinitely.

## Funder anonymization

This is the highest-risk requirement in the product, and it's enforced structurally rather than in the UI:

- `/api/metrics` reads **only** from `metrics_snapshots` — pre-aggregated cohort/period rows. It never joins `participants` or `responses`, so there is no participant-level data on the wire regardless of what filters are applied.
- `/api/funder-updates` returns only staff-authored summaries.
- No other endpoint accepts a funder role.

Rendering aggregates client-side from raw participant rows would have violated the privacy requirement even with a UI that hid the names — hence the aggregate-only table.

## Audit trail

`audit_logs` records the actions the spec calls out as critical: `checkin_sent`, `campaign_sent`, `report_exported`, plus participant create/update/delete. `communication_logs` separately tracks outbound funder communications with channel and direction, which is what the funder-comms workflow reads.

## Frontend structure

- `src/features/{participant,admin,funder}/` — one page component per view, no cross-feature imports.
- `src/components/` — shared primitives (`DataTable`, `Modal`, `FormField`, `KpiCard`, `StatusBadge`, `TrendChart`).
- `src/styles/` — `tokens.css` (the design tokens), `base.css` (reset/typography), `components.css` (shared classes). Pure CSS, no framework.
- Routing: all three roles share the paths `/`, `/checkins`, `/surveys`; small router components in `App.tsx` render the role-appropriate page. Role-specific paths (`/responses`, `/campaigns`, `/updates`) are reachable only from the role's own nav.

`TrendChart` is hand-rolled SVG rather than a chart library — the dashboard needs one bar chart, and a dependency wasn't worth it.

## Deviations from the original brief

The written spec predated some stack decisions and contained leftovers from an earlier SQLite/Express prototype:

| Spec said | We did | Why |
|---|---|---|
| `users.password_hash`, bcrypt | Supabase Auth + `profiles` table | Supabase Auth handles hashing, sessions, and password reset; a custom credential table would duplicate it badly |
| "SQLite seed scripts" | Postgres `seed.sql` | The database is Postgres |
| Integer autoincrement PKs | UUIDs | Required to reference `auth.users(id)` |

## Verification status

What has been checked: the frontend builds and type-checks, the API functions type-check, and every view renders correctly (verified in a browser against a stubbed API — role-based nav, tables, modals, filters, charts, tablet layout).

**What has NOT been checked:** no API endpoint has been executed against a live Supabase project, and no SQL has been run. The migrations and `seed.sql` are unverified against a real Postgres. Run them against a scratch project before trusting them.

## Known gaps

- No test suite yet (see README for the two tests worth writing first).
- Check-in `overdue` status is set at seed time, not by a scheduled job. A cron function flipping `sent` → `overdue` past `due_at` is the natural follow-up.
- Survey `recurrence` is stored but nothing schedules recurring sends yet.
- "Send" on campaigns and funder updates records the action and timestamps it; it does not integrate with an email provider.
