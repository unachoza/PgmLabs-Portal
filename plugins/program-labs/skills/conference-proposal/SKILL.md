---
name: conference-proposal
description: Draft and auto-fill a speaker/session proposal for a conference call-for-speakers, tailored from Alex Waters' Program Labs story bank. Reads the application (pasted questions, screenshot, PDF, or URL), maps every field, writes a paste-ready answer for each within stated limits, then opens the form in the browser and fills it in — stopping before submit. Use when Alex wants to apply to speak, submit an abstract, respond to a call for proposals or speakers (CFP/CFS), or fill out a conference application. Triggers include "submit a talk", "apply to speak at <conference>", "fill out this call for speakers", "draft a session proposal", "conference abstract", "speaker application".
---

# conference-proposal

Turn a conference's call-for-speakers into a completed application for **Alex Waters, Executive Director of The Program Labs**, using his standing story bank.

Two deliverables, in this order:
1. A **submission sheet** — one paste-ready answer per field. Always produced.
2. The **form filled in his browser**, stopped before the submit button. Attempted whenever a live form URL exists.

The sheet comes first and always survives. Browser automation is the convenience layer; if it fights back, the sheet is still a complete answer.

## Source of truth

- **`proposal-kit.md`** (bundled) — Alex's profile, the signature talk, the story bank, bios, and reusable answers at several lengths. **Read it fully before drafting.** Never invent a bio line, statistic, funder, link, or credential that isn't in it.
- **`reference/field-playbook.md`** — how to answer each field type, length routing, per-audience title angles.
- **`reference/browser-autofill.md`** — how to drive the browser without losing work. **Read this before touching a form.**
- **`examples/nawb-forum-2027.md`** — a completed submission sheet. The shape to match.

If the form needs a fact marked `[FILL]` or `[CONFIRM]` in the kit, **ask Alex once**, use his answer, and tell him the exact line to update in the master copy.

## Workflow

### 1. Get the application
- **A URL** — best for auto-fill, since the browser can open it even when a plain fetch can't. Most call-for-speakers forms (Microsoft Forms "Invitation" links, Whova portals, gated Google Forms) are auth-walled to fetching but open fine in Alex's logged-in browser.
- **Pasted questions, screenshot, or PDF** — best for drafting. If there's no URL, produce the sheet and stop there.

Ask for the URL if he only pastes questions and the form is live — auto-fill needs it.

### 2. Map the fields
List every field: label, type (short text / long text / dropdown / radio / checkbox / file upload / URL), character or word limit if stated, required vs optional. Flag what only a human can do: headshot or file upload, video, signed release, fee, travel dates, demographic questions.

Read the form's **intro text**, not just the fields. It often carries the deadline, the tracks, submission caps per organization, and whether speakers pay their own way — none of which appear as fields.

### 3. Pick the framing
One signature talk — **"From AI Consumers to AI Builders: Designing Hackathons That Build Community Innovation Capacity"** — adapted per conference:
- Read the theme, tracks, and audience.
- Choose the closest **track angle** (nonprofit leadership, economic/workforce development, philanthropy/funders, inclusive entrepreneurship, civic innovation) and lean the title, description, and objectives that way — see the playbook.
- Match the **format and length** offered (keynote, breakout, workshop, panel; 30/45/60/90 min).
- If the intro asks you to indicate tracks but there's **no track field**, work the track names into the keywords or summary so the committee still sees them.

### 4. Draft every answer
- **Respect limits.** Count characters before presenting an answer and show the count next to the field (`970/1000`). Never overflow; drop to the next shorter variant rather than truncating mid-sentence.
- **Use the right length variant** from the kit rather than padding or trimming.
- **Adapt, don't reword blindly.** Use the conference's own vocabulary for its audience; keep Alex's voice and the core story intact.
- **ED hero story:** the kit's version is anonymized and names no one, so it is safe to submit as-is. Note that the real, permissioned name/org/quote can be swapped in if accepted.
- **Attribution:** honor the warnings at the top of the kit — frame the hackathon as a **Program Labs × AI Trailblazers** partnership with Alex as community anchor, never as sole author. Use **Executive Director** unless told otherwise.
- **Never fabricate.** No number, link, or credential that isn't in the kit. Mark it `[CONFIRM with Alex]` and flag it. A blank is better than an invention.
- **Name the commitments.** Fields like "what resource will attendees leave with" create an obligation. Say so plainly in the checklist.

### 5. Deliver the submission sheet
```
## <Conference name> — speaker proposal (draft)
<dates, location, deadline, notification date, cost to speaker>

**<n>. <Field label>** [limit, required]
> <answer ready to paste>
```
End with a **Human checklist**: uploads, fee and travel, `[CONFIRM]` items, commitments created, the deadline, and any per-organization submission cap.

### 6. Fill the form in the browser
Do this whenever there's a live URL. Follow **`reference/browser-autofill.md`** — it exists because these forms break automation in specific, repeatable ways.

The rules that matter most:
- **Open the form in a tab Alex can actually see**, and confirm it before filling. A tab in a different browser profile is invisible to him even though it fills perfectly.
- **One field per step, re-screenshot after each.** Textareas grow as they fill and push everything below them down, so coordinates from an earlier screenshot go stale mid-sequence.
- **Verify by reading values back from the page**, not from a screenshot.
- **Never click Submit.** Fill everything, then hand it to Alex to review and submit himself. Leave genuinely ambiguous fields blank and ask.
- If the form resists after a couple of honest attempts, stop and hand over the sheet. Say what broke.

### 7. Log it
Offer to append a row to Alex's submissions log: date, conference, deadline, notification date, session title and angle, format and length, status, link. If no log exists, output the row and offer to start one.

## Rules
- Read `proposal-kit.md` before writing a single answer. It is the authority on every fact.
- Never invent a bio line, statistic, funder, link, or credential.
- Never overflow a stated character or word limit.
- **Never submit a form on Alex's behalf.** Filling is help; submitting is his decision.
- Keep Alex's voice: leadership capacity over technology, "not about the bot," people over prototypes, builds *with* communities rather than *for* them.
