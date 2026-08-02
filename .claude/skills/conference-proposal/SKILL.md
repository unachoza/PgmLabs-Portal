---
name: conference-proposal
description: Draft a speaker/session proposal for a conference call-for-speakers, tailored from Alex's Program Labs story bank. Reads the conference's application (URL, pasted questions, PDF, or screenshot), maps every required field, and writes a paste-ready answer for each — then optionally auto-fills the web form. Use when Alex wants to apply to speak, submit an abstract, respond to a call for proposals/speakers (CFP/CFS), or fill a conference application. Triggers: "submit a talk", "apply to speak at <conference>", "fill out this call for speakers", "draft a session proposal", "conference abstract".
---

# conference-proposal

Turn a conference's call-for-speakers into a paste-ready, tailored proposal for **Alex, Founder & CEO of The Program Labs**, using his standing story bank. Draft first; auto-fill the browser only if asked and only if the form cooperates.

## Source of truth

- **`proposal-kit.md`** (this folder) — Alex's profile, the signature talk, the story bank, bios, and reusable answers at several lengths. **Always read it fully before drafting.** It is the single place facts live; never invent a bio, stat, or credential that isn't in it.
- **`reference/field-playbook.md`** — how to answer the field types conferences ask for, with length rules and adaptation tactics.
- **`submissions-log.md`** — running log of what's been submitted where. Append after each submission.

If a fact the form needs is marked `[FILL]` or `[CONFIRM]` in the kit, ask Alex once, use his answer, and **offer to write it back into `proposal-kit.md`** so it's never asked again.

## Workflow

### 1. Get the application
Accept any of these, in order of preference:
- **Pasted questions** — most reliable. Ask Alex to copy the form's questions in.
- **URL** — try to fetch it (WebFetch / firecrawl). Many CFS forms are auth-walled (Microsoft Forms "Invitation" links, Whova speaker portals, Google Forms behind login). If the fetch is blocked or returns a login wall, **say so plainly and ask Alex to paste the questions or drop a screenshot/PDF** — do not guess the fields.
- **Screenshot or PDF** — read it and extract the fields.

### 2. Map the fields
Produce a table of every field with: label, type (short text / long text / dropdown / file upload / checkbox / URL), character or word limit if shown, and required vs optional. Flag anything a human must handle: headshot/photo upload, video, signed release, fee, travel dates, demographic questions Alex hasn't pre-answered.

### 3. Pick the framing
It's one signature talk — **"From AI Consumers to AI Builders: Designing Hackathons That Build Community Innovation Capacity"** — but adapt it to the conference:
- Read the conference's **theme, tracks, and audience** (from the page or from Alex).
- Choose the closest **track/audience angle** (nonprofit leadership, economic/workforce development, philanthropy/funders, inclusive entrepreneurship, civic innovation) and lean the title/description/objectives that way — see the playbook.
- Match the **session format and length** the form offers (keynote, breakout, workshop, panel; 30/45/60/90 min) and pull the right variant from the kit.

### 4. Draft every answer
For each field, write a tailored answer from the kit:
- **Respect limits.** If a field caps at 100 words / 500 chars, hit it — never overflow. Offer a tighter version if it's close.
- **Use the right length variant** (title, one-liner, short/medium/long description, bio short/medium/long) rather than padding or truncating mid-sentence.
- **Adapt, don't reword blindly.** Swap in the conference's language for its audience; keep Alex's voice and the core story intact.
- **ED example story:** wherever the hero example appears, use the `[ED-NAME]` placeholder block from the kit and add a visible note: *"⚠️ swap in the real, permissioned ED name/org/quote before submitting."*
- Never fabricate metrics. If the form wants a number the kit doesn't have, mark `[CONFIRM with Alex]`.

### 5. Deliver the submission sheet
Output a clean, paste-ready sheet:
```
## <Conference name> — speaker proposal (draft)
Field: <label>  [limit, required]
> <answer ready to paste>
```
End with a **Human checklist**: uploads (headshot, slides/video), fee/travel, the ED-story swap, and any `[CONFIRM]` items. Then ask if Alex wants the auto-fill pass.

### 6. Optional: auto-fill the browser
Only if Alex says yes. Open the form in a browser (Chrome DevTools / Playwright MCP if available), fill the text fields from the submission sheet, and **stop before final submit** so Alex reviews and clicks submit himself. If the form fights back (dynamic fields, captchas, auth), fall back to the paste-ready sheet — that's the reliable path. Never submit on Alex's behalf without explicit confirmation.

### 7. Log it
Append a row to `submissions-log.md`: date, conference, deadline, session title/angle used, format/length, status (drafted / submitted), and the URL. If the team is tracking hackathon/outreach milestones, offer to log an `outreach-launched` milestone — don't do it silently.

## Rules
- Read `proposal-kit.md` before writing a single answer. It is the authority on every fact.
- Never invent a bio line, statistic, funder, or credential. Unknown → `[FILL]`/`[CONFIRM]`, ask once, offer to save it back.
- Never overflow a stated character/word limit.
- Never final-submit a form or send anything outward without Alex's explicit go-ahead.
- Keep Alex's voice: leadership-capacity over tech, "not about the bot," people over prototypes.
