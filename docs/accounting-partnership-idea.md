# Accounting-Software Partnership → Automatic Cohort Financial Tracking

**Team:** ProgramLabs4Life (Table 6)
**Event:** Social Impact HackAIthon — San Diego (Aug 1–2, 2026)
**Owner:** Sergey
**Status:** Idea / early conversation (Aaron @ Intuit — stakeholder conversation logged, no commitment yet)
**Last updated:** 2026-08-01

---

## The idea in one line

Get every cohort company onto a shared accounting platform (QuickBooks via an
Intuit partnership, or an equivalent) so we can **pull their financials
automatically instead of chasing spreadsheets** — turning outcome reporting from
a manual quarterly ask into a live, always-current dashboard.

## Problem it solves

Today, tracking how our cohort companies actually perform (revenue, costs,
profitability, survival) depends on founders manually self-reporting numbers.
That is:

- **Late** — numbers arrive weeks after the period closes, if at all.
- **Inconsistent** — every founder formats and defines things differently.
- **Unverifiable** — self-reported figures can't be trusted for impact reporting
  to funders/board.
- **High-friction** — nagging founders for data burns goodwill and staff time.

If the companies keep their books in one platform we can read, the numbers come
to us — clean, comparable, and current.

## Why now / what makes it credible

We **proved the mechanism works** at the hackathon. Using the Tripletex MCP
connection, we pulled a full July 2026 P&L for a real company (Førstehjelperen
AS) in one API call — revenue, cost breakdown, and net result, structured and
machine-readable:

- Operating revenue: 160 445 NOK
- Operating costs: 387 281 NOK (payroll being the dominant driver)
- Net result: −226 836 NOK

That's exactly the "track company numbers automatically" outcome — just against
one company's books. The partnership is what scales it to the whole cohort.

## The plan

### 1. Pick the accounting backend(s)

| Platform | Notes | Fit |
|---|---|---|
| **QuickBooks Online (Intuit)** | Largest US SMB share; robust API; Aaron is our warm contact. Intuit has education/nonprofit programs. | **Primary target** — US cohort default |
| **Xero** | Strong API, popular with startups, good multi-org accountant tooling. | Backup / non-QBO founders |
| **Tripletex** | Already MCP-connected; proved the pull works. Norway-centric. | Reference implementation / EU |
| **Wave** | Free tier, appeals to earliest-stage founders. | Lowest-friction on-ramp |

Reality check: not every founder will use the same tool. Design the tracking
layer to be **backend-agnostic** — normalize each platform's P&L into one common
schema (revenue / COGS / payroll / other opex / net result).

### 2. Secure the partnership (the Intuit ask)

The concrete ask to Aaron / Intuit:

- **Free or discounted QuickBooks Online** for all cohort participants (removes
  cost as an adoption barrier and standardizes the backend).
- **API / developer access** so ProgramLabs can read participant financials
  (with the founder's authorization).
- Ideally an **accountant-firm / multi-company** arrangement so one connection
  reaches many cohort books, rather than one integration per company.

> ⚠️ Access model matters. In our Tripletex test, the API key reached **exactly
> one company**. To read many companies automatically we need either (a) an
> accounting-office/multi-entity setup, or (b) per-company OAuth authorization
> from each founder. Nail this down early — it's the difference between "one
> dashboard" and "50 separate integrations."

### 3. Build the tracking layer

- Each founder **authorizes read-only access** to their books at onboarding
  (consent is explicit and revocable — see Consent & Privacy below).
- A scheduled job pulls each company's P&L (and key balance-sheet items) monthly.
- Normalize into the common schema; store time series per company.
- Surface as: cohort dashboard, per-company trend, and auto-generated impact
  reports for funders/board.

## What we get out of it

- **Live impact reporting** — real revenue/survival/growth numbers, current, not
  self-reported.
- **Early-warning** — spot a company burning cash (like the −227k month above)
  and intervene with support before it's terminal.
- **Zero founder friction** — after one-time authorization, no more data-request
  emails.
- **Funder credibility** — verified financials beat founder-reported estimates.
- **Benefit to founders too** — free/discounted bookkeeping software is a real
  perk, not just surveillance; frame it as a cohort benefit.

## Risks & open questions

- **Consent & privacy** — founders are sharing sensitive financials. Access must
  be opt-in, read-only, revocable, scoped to agreed metrics, and covered by a
  clear data agreement. This is the make-or-break trust issue.
- **Multi-company access** — see the ⚠️ above; confirm the technical model before
  promising a single dashboard.
- **Platform lock-in** — mandating one tool may not suit every founder; keep the
  backend-agnostic design.
- **Partnership terms** — is Intuit's offer free, discounted, time-limited? What
  do they want in return (logos, case studies, data)?
- **Maintenance** — API integrations drift; someone owns keeping them alive.

## Next steps

- [ ] Turn the Aaron conversation into a **concrete commitment** (free QBO for
      cohort + API access) — log a `secured a commitment` milestone if/when it lands.
- [ ] Confirm the **multi-company access model** with Intuit (accountant firm vs
      per-company OAuth).
- [ ] Draft the **founder data-consent agreement** (read-only, revocable, scoped).
- [ ] Extend the Tripletex proof-of-concept normalization into a **backend-agnostic
      P&L schema** (QBO + Xero + Tripletex → one shape).
- [ ] Scope Xero / Wave as fallbacks for non-QBO founders.

---

*Proof-of-concept reference: July 2026 P&L pulled live via Tripletex MCP
(company: Førstehjelperen AS). Demonstrates the automatic-pull mechanism this
partnership would scale to the full cohort.*
