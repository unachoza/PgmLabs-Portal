# Daily Report — Day 2 (Sun, Aug 2, 2026)

**Event:** Social Impact HackAIthon — San Diego (Claude Impact Lab) · judging day
**Team:** Program Labs / "ProgramLabs4Life" (Table 6) — **top of the leaderboard**
**Nonprofit partner:** Program Labs (Alex — founder)
**Core team today:** Clarissa (product), Serge (engineering), Uma (data/analytics), Kayla (research/content)
**Mentors/stakeholders on site:** Miguel (U.S. Bank funder), Brian (Movement Matters Collective); sponsors Fightable (AI dev shop) and Leticia (legal framework for entrepreneurs)
**Sources:** Granola transcripts "Product development insights" (Aug 2, 9:38 AM) and "Survey feedback and history issues" (Aug 2, 12:42 PM)

---

## TL;DR
Day 2 turned yesterday's deployed portal into a **role-based product** (Admin / Funder / Participant sign-up + views), stood up **Alex's "second brain"** (Obsidian + Claude with daily/monthly automations and 5 connected data sources), and shipped the **conference speaker skill** and a **Gamma funder-pitch deck**. Biggest product insight of the day: **funders don't want a fixed metric set** — each funder (and each bucket inside a funder) needs to configure their own KPIs. We demoed live to a real U.S. Bank funder and held our leaderboard lead into judging.

## What the team did today

### Built & shipped
- **Role-based portal** — sign-up flows for all three roles; **funder sign-up confirmed working**. Participant sign-up hit a bug (missing `first_name` column in profiles) — fix in flight (merge PR → redeploy → verify Supabase fetch on prod).
- **Three role views** — Funder (dashboard, program updates, events, message box, no PII sharing); Participant (own details, workshops, admin contact, survey prompts); Admin (full participant access + housekeeping/follow-up agent).
- **Alex's "AI brain"** (Obsidian + Claude) — folder structure (Organization, Brand, Strategy, Competitors, Archive, Daily); **two scheduled automations**: daily operator (9am, ingests email/transcripts) + monthly optimizer (1st @ 10am, prunes stale content); connected **Fireflies, Gmail, Google Calendar, HubSpot, Canva**; loaded personas, strategy briefs, brand kit, style guide.
- **Conference speaker skill** — paste a conference URL → Claude pulls from Alex's brain → auto-fills the proposal; target locked: **NAWB National (deadline Aug 10)**.
- **Gamma decks** — a generic "how to pitch to funders" deck (doubles as marketing + knowledge-base input) and the demo/judging slides (problem → what we built → demo → future).
- **Notion** — "Alex Conference Strategy" tab compiling conference questions; portal website FAQ content.

### Key product insight (funder metrics)
Alex: funders don't want a fixed set of ~7 metrics. Each funder — and each bucket within one (e.g. U.S. Bank: marketing vs. foundation vs. CRA) — wants different things, including **beyond-program** signals (foot traffic, walk-ins, ecosystem activity). **Decision:** make metric blocks **funder-configurable** on the profile page. Candidate metrics: personal income change, net profit, zip-code change, confidence, jobs created, cohort revenue, capital raised, and now-vs-3mo-vs-1yr comparisons.

### Stakeholder & discovery
- **Miguel (U.S. Bank funder)** — Clarissa ran a **live demo + account creation**; login failed in-session, account created manually after; enthusiastic but no commitment to regular use. Alex's guidance: one text only, he knows Miguel personally.
- **Brian West (alum)** — confirmed he answers every survey Alex sends; surfaced incentive levers for the ~30% response-rate problem: free software (QuickBooks/Wave, HubSpot/Monday), workshops/PD, alumni network + messaging. Alex's ROI framing: QuickBooks ~$250/yr/person — if data value > cost, it pays for itself (and unlocks P&L data for impact reporting).

### Notable
- Held **#1 on the leaderboard**; some teammates were also hackathon participants → easier customer discovery.
- Privacy: Alex prefers to inform participants before recording check-in calls (sensitive financials); Serge flagged California two-party consent for ambient Granola recording.
- Process: Alex asked to be consulted before future external posts about the portal.

---

## Afternoon session (12:42 PM → judging prep)

### Live usability test with a real participant — Erica
Clarissa walked **Erica** (Program Labs participant) through the portal end to end. She created an account and **completed two surveys**. What it surfaced:
- **No survey history.** After submitting, the portal showed no record — same bug Brian hit earlier: the button read "completed", but on next login the survey looked untouched. Participants read that as "my answers vanished."
- **Confidence metric had no visible scale** — she couldn't tell how high it went. Capped at 10.
- **Profile fields were blank and uneditable** — company name, industry, address/zip.
- Erica was the **"no" on the P&L consent email** — reason: she already pays an accountant who handles it, so Intuit access adds nothing for her.

### Incentive research (why participants would share data)
Erica's ranked levers, consistent with Brian's: **three free-subscription buckets** (accounting, CRM, professional-development workshops), plus **tutorials/demos on how to actually use each subscription**, plus **all of Alex's workshop emails consolidated in one place** — she gets them today and ignores them; "in one spot would be way better" — plus ongoing messaging.

### Built in the afternoon
- **Survey history view** — participants now see completed surveys with timestamps; cadence rules enforced (one-time / weekly-once / quarterly). Check-ins render a **Respond** action instead of Submit, replies route back to Alex and land on the participant profile.
- **Editable participant profile** — company name, industry, address/zip.
- **Participant-logged milestones** — workshops attended, learnings, networking/entrepreneurial wins.
- **Handover document** for Alex (Uma).
- **Job ad for Alex's first hire** — written from the brain, **not yet published**; waiting on Alex.
- **Brand kit + style guide** landed in Notion → to be pushed through `impeccable` so the portal looks like Program Labs.

### Conference skill — live test
Ran `/conference-proposal` against the **NAWB** URL in front of the team. The form is a **JavaScript-rendered Microsoft Form**; the skill handled it. Drafted, not submitted — see [handoff](./handoff-2026-08-02-conference-plugin.md).

### Judging criteria — clarified by an organizer on the floor
- **~90% of the score is the milestone log; ~10% is the presentation.** The showcase's "what we shipped" and "evidence of traction" map directly onto the logged milestone categories.
- **"Your named first 10 conversations" was an AI-generated error in the participant handbook.** It actually means: make the **transition plan to the nonprofit** explicit — who owns it after the event and what Alex does with it next week. (Program Labs is only Alex; the team has talked to him far more than 10 times.)
- Organizer's note: the handbook is a guide, not a constraint — swap in whatever better demonstrates the work.

### Presentation framing (decided)
Three problems Alex named → three answers, told as one flow:
1. **Outreach / no national industry relationships** → **conference skill** (a new funder finds him)
2. **Drowning in work, unstructured, one-man army** → **second brain** (he stays organized)
3. **Can't track impact or post-program outcomes** → **portal** (funder logs in, sees the report, funds again)

Five minutes total. Debated demoing on Alex's own laptop to prove real delivery; parked over optics (he organized the event) and time. Team also chose not to over-optimize for winning for the same reason.

### Known gaps at judging time
- **No transactional email** — signup confirmation and password reset are not wired. Needs Alex's org domain rather than a generic sender; deferred until he approves and the Supabase project is transferred to his account.
- Supabase free tier: **45 MB of 500 MB** used, well inside limits; upgrade path is a plan change.
- Uma's caveat, stated plainly: "there will be so many bugs — this is a prototype," nothing hardened yet.

### Learning
No tight MVP was agreed up front. Each round of participant feedback added candidate features, and scope drifted. Clarissa: the fix is naming the committed feature set early and testing every request against it.

## Next steps (into judging)
- Fix participant sign-up → redeploy → verify on prod.
- Add funder-configurable metric blocks; replace dummy data with real/structured sample data.
- Re-engage Miguel before judging (one text).
- Connect Alex's Fireflies board-meeting transcripts (last 4 quarterly) to the brain (Serge).
- Finish + test the conference speaker skill against the NAWB link; Alex reviews pre-fill before Aug 10 (Serge).
- Build the Gamma "pitch to funders" deck (Kayla); add Alex's brand kit + style guide to Claude.
- **Log Day 2 milestones before the board closes** — see [milestones-2026-08-02.md](./milestones-2026-08-02.md).
- Get Alex's sign-off and publish the first-employee job ad.
- Restyle the portal with the brand kit via `impeccable`.
- Record a Loom of the demo as a fallback if the live walkthrough breaks.
