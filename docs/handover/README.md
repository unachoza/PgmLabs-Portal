# Handover Documentation

This folder is for whoever picks up **Program Labs Portal** next — a new
maintainer, a stakeholder standing up their own copy, or someone doing a
scheduled maintenance pass. It's written to be usable without having sat in
on the original build.

<!-- Comment for readers: if something here is wrong or out of date, it means
the app changed and this doc didn't. Fix the doc in the same PR as the code
change that broke it — don't leave it to the next person. -->

## Read these in order

1. **[01-requirements.md](./01-requirements.md)** — what accounts, access,
   and tools you need *before* you start, and an honest list of what this
   prototype does **not** do yet. Read this first so you don't discover a
   missing account halfway through setup.
2. **[02-setup-guide.md](./02-setup-guide.md)** — step-by-step: clone,
   install, configure, migrate the database, seed data, run locally, deploy.
   Written so a stakeholder who is comfortable with a terminal but didn't
   build this can follow it end to end.
3. **[03-monthly-maintenance.md](./03-monthly-maintenance.md)** — a
   recurring checklist for whoever owns this after handover. ~15–30 minutes
   a month if nothing's wrong; longer the first time.

## How this relates to the other docs in this repo

This folder is the **operational** "how do I stand this up and keep it
running" story. It deliberately doesn't repeat product or architecture
context that's already documented elsewhere:

| Doc | What it's for |
|---|---|
| [`/README.md`](../../README.md) | Quick reference: stack, roles, API endpoint table, scripts |
| [`/ARCHITECTURE.md`](../../ARCHITECTURE.md) | How authorization works, why decisions were made, known gaps |
| [`/PRODUCT.md`](../../PRODUCT.md) | What this product is, who it's for, positioning, evidence on hand |
| [`/DEPLOYMENT.md`](../../DEPLOYMENT.md) | ngrok tunnel notes for exposing a local dev server |

If you're setting this up for the first time, start with this folder. If
you're trying to understand *why* something was built a certain way, go to
`ARCHITECTURE.md`. If you're pitching this to a funder or partner, go to
`PRODUCT.md`.

## Fastest path to "it's running"

```bash
npm install
cp .env.example .env      # fill in Supabase values — see 02-setup-guide.md
npm run dev                # mock mode, no Supabase needed yet
```

That gets you a working UI against fake in-memory data in under five
minutes, useful for a first look. Everything past that — a real database,
real auth, a production deploy — is in the setup guide.
