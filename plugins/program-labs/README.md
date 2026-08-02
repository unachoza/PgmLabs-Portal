# Program Labs plugin

Conference speaker proposals for **Alex Waters, Executive Director of The Program Labs** —
drafted from a standing story bank, then filled into the live form in his browser.

## Install

Settings → **Plugins** → **Add marketplace**, then:

```
unachoza/PgmLabs-Portal
```

Then install the **Program Labs** plugin from that marketplace and enable it.

> The marketplace manifest lives at `.claude-plugin/marketplace.json` on the repo's **default
> branch (`main`)**. Changes on a feature branch are not visible to the installer until merged.

## Use

Alex starts a chat and says any of:

- "Apply to speak at this conference: `<URL>`"
- "Fill out this call for speakers" + pastes the questions
- Uploads a screenshot or PDF of the application

He gets back:

1. A **submission sheet** — one paste-ready answer per field, with character counts against each stated limit.
2. The **form filled in his browser**, stopped before the submit button, for him to review and submit.

Plus a human checklist: headshot uploads, fees and travel, unresolved facts, the deadline, and
any commitment the proposal creates.

**Give it the URL when the form is live.** Auto-fill needs it, and most call-for-speakers forms
(Microsoft Forms invitation links, Whova portals, gated Google Forms) can't be read from a link
but open fine in a logged-in browser.

## What's inside

```
skills/conference-proposal/
├── SKILL.md                       the workflow
├── proposal-kit.md                Alex's profile, talk, story bank, bios   ← edit this
├── reference/
│   ├── field-playbook.md          how to answer each field type; title angles per audience
│   └── browser-autofill.md        how to drive a form without losing the work
└── examples/
    └── nawb-forum-2027.md         a completed submission sheet
```

## Maintaining it

Everything factual lives in **`proposal-kit.md`**. Edit it, commit, push to `main` — installs
pick up the change. Never let a second copy of the kit exist; one source of truth is the whole
point.

Open items still worth resolving in the kit:

- Alex's pronouns — not found in any source material
- Links to past talks, slides, or video — the NAWB form asked for these and none existed
- The cohort count discrepancy — "two cohorts completed" vs. emails referencing "Cohort 11"
- The real, permissioned ED hero story (name, org, quote) to replace the anonymized version

## Standing guardrails

- Never invents a bio line, statistic, funder, link, or credential — unknowns are flagged, not filled.
- Frames the hackathon as a **Program Labs × AI Trailblazers** partnership with Alex as community
  anchor, never as sole author.
- Uses **Executive Director**, matching every verified source.
- **Never submits a form.** Filling is help; submitting is Alex's call.
