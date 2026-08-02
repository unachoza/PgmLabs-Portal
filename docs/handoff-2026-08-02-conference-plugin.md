# Handoff — conference-proposal plugin + NAWB submission

**Date:** 2026-08-02
**Branch:** `docs/day2-report-and-conference-skill` → PR [#15](https://github.com/unachoza/PgmLabs-Portal/pull/15) (open, base `main`)
**Commit added this session:** `e5838e7`

Two things happened: Alex's proposal was drafted and filled into the NAWB Forum 2027
application, and the skill that produced it was repackaged as an installable plugin.

---

## 1. NAWB Forum 2027 submission — DRAFTED, NOT SUBMITTED

**Conference:** NAWB Forum 2027: Lead. Influence. Transform.
**Where/when:** New York City, April 4–7, 2027
**Form:** Microsoft Forms (Request for Concurrent Session Proposals), 14 questions, no file uploads
**Link:** https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=jBWA57bSEUeH_iNHkb7y_5LEhaEuqfpGqQPwyUuGI-FUNEVVQklRWE9JQldIOTA5R0kwU1AxTE5TVS4u&origin=Invitation&channel=0
**Angle:** AI and Future Technology + Partnerships and Economic Development tracks
**Title used:** *From AI Consumers to AI Builders: Hackathons as Regional Innovation Infrastructure*

### State
All 14 fields were filled in a browser tab. **Submit was never clicked.** That tab is in a
**different Chrome profile** from the one Sergey was browsing in, which is why the form looked
empty to him — his own second tab on the same URL was the one he could see. The filled tab may
not survive a browser restart, and Microsoft Forms does not persist un-submitted input.

**The reliable copy is the paste-ready sheet:**
`.claude/skills/conference-proposal/nawb-forum-2027-submission.md`

It contains all 14 answers verbatim with character counts. Paste and submit from there.

### Before submitting — unresolved
- **Q6 has no links.** The form explicitly asks for "links to slides, videos, or talks." None
  existed in the kit and none were invented. Weakest answer on the form.
- **Q12 is a commitment.** It promises an "AI Innovation Journey Playbook" — a one-page seven-step
  template plus facilitation checklist and partner map. It does not exist yet and would be owed
  if accepted.
- **Deadline is not stated anywhere on the form.** Notification is "early September 2026," so it
  is likely close. Verify with NAWB.
- **Org cap:** max 2 proposals per organization. This is #1.
- **No reimbursement.** Accepted speakers pay their own registration (reduced rate), travel, and
  lodging to NYC.
- Q9's ED hero story is **anonymized** (names no one) — safe as-is; swap in the real permissioned
  name/org/quote if accepted.
- Q14 co-presenter answered **No** (Alex solo), per Sergey's decision.

Logged in `.claude/skills/conference-proposal/submissions-log.md` as *drafted*.

---

## 2. The plugin

Repackaged so Alex can install the skill from GitHub rather than needing a Claude Code checkout.
Layout copied from [leaders-adapt/LeadersAdapt](https://github.com/leaders-adapt/LeadersAdapt).

```
.claude-plugin/marketplace.json          ← what "Add marketplace" reads
plugins/program-labs/
├── .claude-plugin/plugin.json
├── README.md
└── skills/conference-proposal/
    ├── SKILL.md
    ├── proposal-kit.md                  ← all facts live here; edit this
    ├── reference/field-playbook.md
    ├── reference/browser-autofill.md    ← new
    └── examples/nawb-forum-2027.md
```

### Install path (only works after PR #15 merges)
`Settings → Plugins → Add marketplace → unachoza/PgmLabs-Portal`

The installer reads the repo's **default branch**. The manifest is invisible on a feature branch.

### Changes to the skill vs. the original
- **Browser auto-fill is a first-class step**, not an afterthought. The submission sheet is still
  produced first and always; auto-fill is the convenience layer on top.
- **New `reference/browser-autofill.md`** — written from what actually broke during the NAWB run:
  - Check `document.visibilityState` *before* filling. Browser tooling can open its tab in another
    Chrome profile; it fills perfectly and the user sees an empty form. Cost ~20 minutes.
    (Chrome's Cmd+Shift+A tab search is profile-scoped; the macOS **Window** menu is not.)
  - One field per step, re-screenshot after each. Textareas expand as they fill and push
    everything below them down, so batched coordinates go stale mid-sequence — that's how Q6
    silently vanished and keystrokes hit a browser extension instead of the form.
  - Verify by reading values back from the DOM. A screenshot proves what a tab renders, not which
    tab the user is looking at.
  - Never click Submit. Leave genuinely-his-call fields blank and ask.
  - Known quirks: Microsoft Forms lazy-renders questions (scroll to make them exist), Google Forms
    lose state on back-navigation, Whova times out, extensions intercept stray keystrokes.
- **Corrected "Founder & CEO" → "Executive Director"** in the skill body. It contradicted
  `proposal-kit.md`'s own warning #1, which documents that every verified source says Executive
  Director.
- **Two new rules** the NAWB run exposed: state character counts alongside each answer, and flag
  fields that create obligations.
- **Ships the NAWB sheet as a worked example.**

### Deliberately unchanged
`.claude/skills/conference-proposal/` — the Claude Code version still works from a checkout.
Note this means **two copies of `proposal-kit.md` now exist**; they will drift. Worth collapsing
to one at some point.

---

## Open items

**Immediate**
1. Submit the NAWB proposal (or decide not to). Deadline unknown — verify it.
2. Merge PR #15 so the plugin becomes installable.
3. Optionally retitle PR #15 — its title predates the plugin work and undersells the scope.

**After the hackathon**
4. **Move the marketplace to Alex's org.** It currently lives in `unachoza/PgmLabs-Portal`, a
   teammate's portal app repo. Alex's bio and story bank shipping inside someone else's
   application repo is wrong long-term, and every skill edit becomes a PR against it. When moved:
   update the URL in `plugins/program-labs/README.md`, re-point anyone who already added the
   marketplace, and put the manifest on the new default branch.

**Facts still missing from `proposal-kit.md`**
5. Alex's pronouns — not found in any source material.
6. Links to past talks, slides, or video — NAWB asked, nothing existed.
7. Cohort count discrepancy — "two cohorts completed" vs. emails referencing "Cohort 11."
8. The real, permissioned ED hero story (name, org, quote) to replace the anonymized version.
   Hackathon judging was Monday; the standout participant should be known now.

**Untested**
- The plugin has never been installed end to end. Requires the manifest on `main` first.
- Whether Claude Cowork's plugin installer accepts this marketplace format. The layout matches
  the LeadersAdapt repo Sergey pointed to, but no Cowork installer documentation was available.

---

## Discarded

An earlier Agent Skills `.zip` package was built at `dist/cowork/` before the pivot to the plugin
marketplace. `dist/` is gitignored, so it never entered the repo. Safe to delete locally:
`rm -rf "dist/cowork"`
