# Daily Report — Day 2 (Sun, Aug 2, 2026)

**Event:** Social Impact HackAIthon — San Diego (Claude Impact Lab) · judging day
**Team:** Program Labs / "ProgramLabs4Life" (Table 6) — **top of the leaderboard**
**Nonprofit partner:** Program Labs (Alex — founder)
**Core team today:** Clarissa (product), Serge (engineering), Uma (data/analytics), Kayla (research/content)
**Mentors/stakeholders on site:** Miguel (U.S. Bank funder), Brian (Movement Matters Collective); sponsors Fightable (AI dev shop) and Leticia (legal framework for entrepreneurs)
**Source:** Granola transcript "Product development insights" (Aug 2, 9:38 AM)

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

## Next steps (into judging)
- Fix participant sign-up → redeploy → verify on prod.
- Add funder-configurable metric blocks; replace dummy data with real/structured sample data.
- Re-engage Miguel before judging (one text).
- Connect Alex's Fireflies board-meeting transcripts (last 4 quarterly) to the brain (Serge).
- Finish + test the conference speaker skill against the NAWB link; Alex reviews pre-fill before Aug 10 (Serge).
- Build the Gamma "pitch to funders" deck (Kayla); add Alex's brand kit + style guide to Claude.
