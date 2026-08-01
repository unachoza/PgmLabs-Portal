
# Participant Engagement and Funder Reporting App

This repository now includes a working prototype application based on the prompt in [PROMPT.md](PROMPT.md).

## Stack

- Frontend: Vanilla HTML, CSS, JavaScript
- Backend: Node.js with Express
- Database: SQLite

## One-Command Start

Run:

  npm run start:app

This command installs dependencies if needed, initializes and seeds the database on first run, then starts the server.

Main script location: ./start-app.sh

## Quick Start

1. Install dependencies:

  npm install

2. Initialize the database schema:

  npm run db:init

3. Seed sample data:

  npm run db:seed

4. Start the server:

  npm run dev

5. Open the app in a browser:

  http://localhost:3000

## Seeded Logins

- Admin: admin@accelerator.org / password123
- Funder: funder@bank.org / password123
- Participant: participant1@example.org / password123

## Key Features Implemented

- Role-based login and protected APIs (admin, participant, funder)
- Participant management (admin)
- Check-ins and participant responses
- Survey CRUD and participant survey submissions
- Funder updates management
- Marketing campaign draft and send flow
- Aggregated KPI dashboard for admin/funder
- CSV export for participant responses

## API Overview

- /api/auth/login, /api/auth/logout, /api/auth/me
- /api/participants (CRUD)
- /api/checkins (CRUD) and /api/checkins/:id/response
- /api/surveys (CRUD) and /api/surveys/:id/submissions
- /api/metrics/dashboard
- /api/funder-updates (CRUD)
- /api/marketing-campaigns (CRUD) and /api/marketing-campaigns/:id/send
- /api/exports/responses.csv

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for implementation notes.

---

# Hackathon Plan

## Goals

- ROI
- Outcomes
- Quickly determine whether the idea provides value to stakeholders
- Engage with real stakeholders to identify new donors in this area
  - Interact with real people
- Improve meeting workflows by leveraging meeting transcripts as context
- Earn a free month at Kiln if we win

## How to Win

### Experiments

- Run a real behavioral test with real people
- Conduct stakeholder interviews with notes
  - Prospective partners
  - Funders
  - Beneficiaries
  - Customers

### Commitments Secured

- Someone said yes to something concrete

### Assets Shipped

- A real artifact in customers' hands

### Outreach Launched

- A real campaign

## Team Hygiene

- Evidence that the team is steering AI teammates effectively

## Log to get points
- aitrailblazers.org/hackathon-sd/leaderboard

---

Requirements

- mentoring
- 1 on 1 checkins
- class numbers
- workshops
- most have another job
- intial assesment
- measurement
  - jobs created or retained, not a good metric
  - Revenue
  - Net profit
  - Customer base
  - 

- serverys
- email 
- annecdotal data
- meeting
- external data sources


- business understanding
- datat understanding
- 

---

The six CPMAI phases:

1. **Business Understanding** — Define the problem, business goals, stakeholders, risks, and success measures.
**Business Accelerator**
- mentoring
- 1 on 1 checkins
- class numbers
- workshops
- most have another job
- intial assesment
- measurement
  - jobs created or retained, not a good metric
  - Revenue
  - Net profit
  - Customer base
  - 
2. **Data Understanding** — Identify available data and evaluate its quality, relevance, accessibility, privacy, and bias.
- hubspot
- csv
- numbers
- emails
- names
- incentives, 
- getting rich data overtime, increases ranking of the nba program,

- state of biz owners at start of program
- source of truth, CRM CSV
- platform to create incentives, funding, discounts, networking, grants, office hours, only access if you update

- track data long term, make it easier,

3. **Data Preparation** — Clean, organize, label, transform, and prepare the data for use.
4. **Model Development/Agent Development** — Select the AI approach, build the solution, train it, and improve it through iteration.
5. **Model Evaluation/Agent Evaluation** — Test whether the model is accurate, reliable, ethical, and aligned with the business goal.
6. **Model Operationalization/Agent Operationalization** — Deploy the solution, integrate it into operations, monitor performance, and continuously improve it.

## Outcome
- Give him more hands
- Processes around outreach
- Identifying the right people to talk to about potential customers
- logistics and coordintiaont around the program, per participant
  - coordinate workshops
  - write contracts
  - checkins weekly
  - onboarding
  - next steps, participants
  - #1 time suck, weekly checkins
---

[x] cloud code credits
[x] claude code installed
[] outcome udneratnding

Inputs, activities, outputs, outcomes, impacts

