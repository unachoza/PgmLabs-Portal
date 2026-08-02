# conference-proposal skill

A Claude Code skill that drafts tailored **speaker/session proposals** for conference
calls-for-speakers, using Alex's Program Labs story bank. Draft-first; optional browser auto-fill.

## How Alex uses it

1. Open Claude Code in this repo.
2. Say something like:
   - "Apply to speak at this conference: <paste the call-for-speakers URL>"
   - or paste the application's questions directly, or drop a screenshot/PDF.
3. Claude reads `proposal-kit.md`, maps the form's fields, and returns a **paste-ready answer for every field**, plus a short checklist of anything a human must do (upload a headshot, confirm a fee, swap in the real ED name).
4. Optionally: "now auto-fill the form" — Claude opens it in a browser and fills what it can, stopping before the final submit so Alex reviews and clicks submit.

> Tip: pasting the form's questions is the most reliable input. Many conference forms
> (Microsoft Forms invitation links, Whova portals) are login-gated and can't be fetched.

## Maintaining it (one-time + occasional)

Everything factual lives in **`proposal-kit.md`**. Fill the `[FILL]` items once (Alex's
email, headshot, LinkedIn, past talks, fee/travel) and verify the `[CONFIRM]` stats.
After that, the skill reuses it for every conference. Update the kit whenever the talk,
bio, or stats change.

## Files
- `SKILL.md` — the workflow Claude follows (the actual skill).
- `proposal-kit.md` — Alex's profile + signature talk + story bank (edit this).
- `reference/field-playbook.md` — how to answer each field type; title angles per audience.
- `submissions-log.md` — running log of where proposals have gone.
