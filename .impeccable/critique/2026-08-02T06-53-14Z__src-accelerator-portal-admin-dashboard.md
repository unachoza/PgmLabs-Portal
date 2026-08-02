---
target: admin dashboard (src)
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-08-02T06-53-14Z
slug: src-accelerator-portal-admin-dashboard
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Create/edit modals close silently on success with no toast — admin must re-scan the table to confirm the action worked |
| 2 | Match System / Real World | 3 | Domain vocabulary is real and consistent, but raw enum values leak unformatted into the UI (`all_funders`, `prospects`) |
| 3 | User Control and Freedom | 2 | Modals exit cleanly (Esc/backdrop/Cancel), but irreversible sends have zero confirmation and no undo |
| 4 | Consistency and Standards | 4 | Genuinely strong — one Modal, one FormField, one DataTable, one Badge reused everywhere with no drift |
| 5 | Error Prevention | 2 | Only HTML `required` validation; no confirm-before-send on one-way broadcast actions (campaigns, funder updates, check-ins) |
| 6 | Recognition Rather Than Recall | 3 | All actions text-labeled, but no sort/filter affordances on any table |
| 7 | Flexibility and Efficiency | 1 | Zero keyboard shortcuts, zero bulk actions, no table sort, no CSV import to match the CSV export |
| 8 | Aesthetic and Minimalist Design | 3 | Clean and uncluttered, but the Financials bar chart duplicates numbers already shown in the table above it |
| 9 | Error Recovery | 2 | Errors surface as raw `err.message` in a generic banner, not tied to the offending field, no recovery guidance |
| 10 | Help and Documentation | 0 | No help affordance anywhere — no tooltip on "Sync now," no note on the single-company-scoping constraint |
| **Total** | | **23/40** | **Acceptable — significant improvements needed before users are happy** |

Rating band: 23/40 = 57.5%, squarely in the "Acceptable" band (20-27).

## Design Specificity Verdict

**LLM assessment (Assessment A):** This is a competent, honest CRUD admin — not a generic template dropped in unchanged, but not fully authored for an accelerator/impact-tracking product either. Real specificity signals exist: consistent domain vocabulary (cohort, check-in, funder update, campaign) and a genuinely product-specific Cohort Financials subhead tying straight to the "verified, not self-reported" positioning claim in PRODUCT.md.

But the visual system undercuts it. Every admin surface — Participants, Check-ins, Surveys, Responses, Funder Comms, Marketing, and critically Cohort Financials, the single feature meant to differentiate this product — renders through the identical KpiCard + DataTable + Modal + FormField combination with zero visual differentiation between them. Cohort Financials, the proven hackathon-differentiating capability (a live Tripletex pull for a real company), gets the same chrome as a Marketing Campaigns draft list. Nothing in the composition signals "this data is verified and pulled live, treat it differently from self-reported survey text" — which directly undercuts the product's own "Verified over self-reported" principle.

On the cobalt rebrand specifically: it's a real, isolated change, and cobalt against the dark slate sidebar is a legible, purposeful pairing. But it's a single accent island — card surfaces are still warm cream, borders still warm gray-tan, warning badges still amber (a close cousin of the retired terracotta). "Stale" hasn't fully left; it retreated to surfaces and badges while primary CTAs got a cooler paint job. This reads as a targeted patch, not a systemic mood shift.

**Deterministic scan (Assessment B):** The static-source CLI scan (`detect.mjs --json src`) returned zero findings — but the browser-injected detector, running against live rendered DOM and computed styles, found four recurring anti-patterns across every page tested: `cramped-padding` on `div.table-wrap` (all 4 pages), `oveused-font` (Roboto at 100% of text, all 4 pages), `low-contrast` (2.9:1 measured vs. 4.5:1 required, on `span.badge.badge-warning`, 2 of 4 pages), and `monotonous-spacing` (~4px reused 79-85% of the time, on the three denser data-table pages). The CLI "clean" result is scoped to static-markup checks only and should not be read as clearing the interface generally — the computed-style/runtime detector is what actually surfaced findings.

Two of these (`oveused-font`, `monotonous-spacing`) are plausible false positives — a single consistent typeface and a disciplined 4px spacing scale are common, often-correct choices the detector can't distinguish from accidental sameness. The other two (`cramped-padding`, `low-contrast`) are measured DOM/contrast-ratio facts, not judgment calls, and are treated as confirmed defects below.

## Overall Impression

The component system is the strongest thing here — one Modal, one DataTable, one FormField, reused everywhere with zero drift, which is rare discipline for a hackathon build. But the interface plateaus at "clean and consistent" rather than reaching "elevated and trustworthy," because the one feature built to prove the product's core claim (verified, automatically-pulled financial data) looks visually identical to every self-reported page around it, and the cobalt rebrand changed the action color without touching the surface palette that was making things feel flat in the first place. The single biggest opportunity: make Cohort Financials look and feel different from the rest of the app, on purpose.

## What's Working

1. **Component consistency** (`DataTable.tsx`, `Modal.tsx`, `FormField.tsx`, `Badge.tsx`) — every admin page composes the same four primitives with no ad hoc styling drift.
2. **The focus-visible ring** — confirmed live on a mobile viewport: a crisp, clearly visible cobalt outline on interactive elements. Better than most hackathon builds bother with.
3. **Cohort Financials' subhead copy** ("Real P&L pulled from each company's accounting backend and normalized to one schema — not self-reported") — a rare instance of UI copy carrying real product positioning instead of generic labeling.

## Priority Issues

**[P0] Raw JSON dumped directly into the Responses table**
What: `AdminResponsesPage.tsx` renders `<pre>{JSON.stringify(r.payload_json)}</pre>` — admins see literal `{"revenue_band":"50k-100k","jobs_created":2,"challenges":"Hiring speed"}` instead of formatted key-value rows.
Why it matters: This is the page admins use to actually read what founders said. Forcing JSON-parsing on every row is pure extraneous cognitive load, and it works directly against "low founder friction" — the founder took time to answer, and the admin now has to decode syntax to read it.
Fix: Render `payload_json` as a labeled definition list (question → answer) using the check-in/survey question metadata, not a stringified blob.
Suggested command: `/impeccable clarify`

**[P1] Warning badge text fails WCAG contrast**
What: `span.badge.badge-warning` measures 2.9:1 contrast against its cream background — well under the 4.5:1 WCAG AA minimum for text. Confirmed via computed-style measurement on the Participants and Funder Comms pages (not a judgment call).
Why it matters: This is the "paused" participant status and "pending" funder follow-up status badge — a real accessibility failure on status information admins rely on to scan at a glance.
Fix: Darken `--color-warning` (currently `#b8853f`) until it clears 4.5:1 against `--color-bg-surface`, or add a background fill behind warning badges instead of relying on text color alone against cream.
Suggested command: `/impeccable audit`

**[P1] No confirmation before irreversible broadcast sends**
What: "Send" on Marketing Campaigns, "Send update" on Funder Comms, and "Send to N recipients" on Check-ins all fire immediately on click with zero confirm step and no undo afterward.
Why it matters: These are one-way messages to real founders and funders. A misclick sends a half-drafted campaign or funder update with no recovery path.
Fix: Add a lightweight confirm step before any of these three actions fire — doesn't need to be a full modal, even an inline "Confirm send?" toggle closes the gap.
Suggested command: `/impeccable harden`

**[P1] Cohort Financials has no visual distinction from self-reported data**
What: The product's core differentiator (verified, automatically-pulled P&L) renders with the identical KpiCard/DataTable pattern used for manually-typed survey responses and campaign drafts.
Why it matters: The whole positioning claim is "verified over self-reported" — but visually, an admin can't tell Financials apart from any other CRUD page. The one feature that should look and feel different doesn't.
Fix: Give Financials a distinguishing visual marker tied to "verified" status — a "synced from Tripletex" provenance chip on the KPI cards themselves, or a distinct accent treatment signaling live-data status.
Suggested command: `/impeccable clarify`

**[P2] Modal has no focus management**
What: `Modal.tsx` opens with `role="dialog"` and Esc-to-close wired up, but never moves focus into the dialog on mount and doesn't trap Tab within it.
Why it matters: A keyboard/screen-reader user triggering "Add participant" has no guarantee focus lands on the first field — they may need to tab through residual page content to reach the form.
Fix: Focus the first focusable element (or the modal container) on mount, and trap Tab within `.modal` while open.
Suggested command: `/impeccable harden`

## Persona Red Flags

**Alex (Power User):** No table sorting or column filtering anywhere — Participants, Responses, and Financials tables are all display-only with a single freetext search box. No bulk actions: tagging a Response, updating multiple participant statuses, or selecting check-in recipients all require one-at-a-time clicks (the recipient list is a raw checkbox grid with no "select all"). CSV export exists but there's no matching CSV import. Zero keyboard shortcuts anywhere. Alex abandons after the third individual-click workflow.

**Sam (Accessibility-Dependent User):** The focus ring itself is genuinely good (verified live). But `Modal.tsx` doesn't move focus into the dialog on open or trap it, so keyboard/screen-reader flow through "Add participant," "Build survey," etc. is unpredictable. `AdminSurveysPage.tsx` skips a heading level — page is `<h1>Surveys</h1>` and survey card titles jump straight to `<h3>`, with no `<h2>` between, breaking heading-based screen-reader navigation. The Check-ins recipient checkbox list has no `<fieldset>/<legend>` grouping — a screen reader announces each checkbox individually with no group context. And the confirmed `badge-warning` contrast failure above means low-vision users may not reliably read status at all.

## Minor Observations

- `cramped-padding` on `div.table-wrap` recurred on every single page tested (4/4) — a systemic, not one-off, spacing gap worth a pass even though it's lower severity than the items above.
- `oveused-font` (Roboto, 100% of text) and `monotonous-spacing` (~4px, 79-85% of instances) were flagged by the detector on every page but are plausible false positives — a single consistent typeface and a disciplined spacing scale are common, defensible choices. Worth confirming intentional rather than treating as defects.
- The Financials bar chart (`TrendChart`) duplicates numbers already in the table directly above it with no added insight — it's named "TrendChart" but shows a single latest-period snapshot per company, not an actual trend over time.
- `AdminResponsesPage.tsx` search only filters by participant name, not by response tags or content — inconsistent with tags being the page's primary organizing tool.
- The sidebar footer overrides `.btn-secondary` for its dark background — a thoughtful patch, but it signals the base `.btn-secondary` token wasn't designed with dark contexts in mind.

## Questions to Consider

1. If Cohort Financials is the entire pitch — verified data beats self-reported spreadsheets — why does it look exactly like every self-reported page in the app? What would it look like if "verified" were a first-class visual state, not just subhead copy?
2. The rebrand moved one variable (`--color-accent`) and left the rest of the palette (cream surfaces, tan borders, amber warnings) untouched. Is "swap the accent" actually the fix for "feels stale," or does stale live in the surface/border palette that never got touched?
3. With 7 admin nav items and zero bulk actions, what does this dashboard look like once a cohort has 50 participants instead of 3 — does the current one-at-a-time interaction model survive that, or does it visibly buckle first?
