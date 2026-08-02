# Browser auto-fill

How to fill a conference application in Alex's browser without losing the work. Every rule
here comes from a real failure on a real submission.

Use whatever browser automation is available in the current environment (the Claude in Chrome
extension, or a Chrome DevTools connection). The tool names differ; the failure modes don't.

---

## Before you fill anything

**1. Make sure Alex can see the tab.**

This is the one that wastes the most time. Browser tooling often opens its own tab group —
sometimes in a *different Chrome profile* than the window Alex is looking at. The form fills
perfectly and he sees an empty form, because he's looking at his own second tab on the same URL.

Check it directly:

```js
document.visibilityState   // "hidden" means this is NOT the tab he's looking at
```

If it's hidden, say so immediately and confirm which tab he's in before filling 14 fields into
the wrong one. Chrome's Search Tabs (Cmd+Shift+A) only searches the **current profile**, so a
tab in another profile is genuinely unfindable that way — the macOS menu bar **Window** menu
lists windows across all profiles, and that is the reliable way to find it.

**2. Never reload a partly-filled form.** Microsoft Forms, Google Forms, and Whova do not
restore un-submitted input. A reload means refilling everything.

**3. If Alex already has the form open, use his tab.** Don't open a second one. Two tabs on the
same URL is exactly how the invisible-tab problem starts.

---

## While filling

**One field per step. Re-screenshot after each.**

Textareas expand as they fill. A long bio answer grows the box by several lines and pushes every
field below it down the page. Coordinates captured before that expansion are stale — a click
meant for question 6 lands in dead space, and the keystrokes go to the page instead of an input,
where they can trigger browser-extension keyboard shortcuts.

Batching clicks and typing across multiple fields in one sequence is how answers silently vanish.
Batch only within a single field: click → type → screenshot.

**Short single-line fields can be safely paired.** Text inputs don't change height, so two or
three in a row are fine.

**Radio buttons and checkboxes: click, then verify the selection visually.** Setting a value
programmatically often doesn't register with the page's own state.

---

## Verifying

Screenshots prove what a tab renders. They do not prove which tab Alex is looking at.

Read the values back from the page itself:

```js
[...document.querySelectorAll('input[type=text], textarea')]
  .map(e => ({ len: e.value.length, head: e.value.slice(0, 40) }))
```

Report the character counts. They confirm the text arrived intact and that limits weren't
exceeded — a summary capped at 1000 characters should read close to it, not 200.

---

## Stopping

**Never click Submit.** Fill every field you can, then hand it over: what's filled, what's blank
and why, and what to check before submitting.

Leave a field blank rather than guessing when the answer is genuinely Alex's call (a co-presenter,
a fee, a travel commitment, a demographic question). Ask, then fill it.

---

## When to give up

After two honest attempts at the same obstacle, stop and deliver the paste-ready sheet. Say
plainly what broke. Things worth giving up on quickly:

- Login walls and SSO redirects
- CAPTCHAs — never attempt these
- Multi-page forms that lose state between steps
- Fields that reject programmatic input entirely
- File uploads — headshots and slides always go on the human checklist

The sheet is a complete deliverable. Auto-fill is convenience, and it is never worth burning
twenty minutes on a form that will take Alex three minutes to paste.

---

## Known form quirks

**Microsoft Forms** — lazy-renders questions, so only the first few exist in the DOM on load.
Scroll to bring later questions into existence before looking for them. "Invitation" links can't
be fetched but open normally in a logged-in browser. No autosave.

**Google Forms** — multi-page forms lose everything on back-navigation. Fill one page fully,
screenshot it, then advance.

**Whova speaker portals** — session-timeout heavy. Check you're still logged in before a long fill.

**Browser extensions** — highlighters, grammar tools, and clipboard managers intercept keystrokes
that land outside an input, and their sidebars change the viewport width mid-fill. If a sidebar
opens unexpectedly, that's the signal that typing went somewhere it shouldn't have. Re-verify the
last field.
