# Prompt: Build a Participant Engagement and Funder Reporting Web App

Build a complete web application for a business accelerator program using:

- Frontend: Vanilla HTML, CSS, and JavaScript (no frameworks)
- Backend: Node.js with Express
- Database: SQLite

The application should help accelerator teams stay in constant contact with participants, track outcomes, and keep financiers (banks, funders, and program sponsors) updated with credible success metrics.

## Product Goals

1. Maintain regular communication with accelerator participants.
2. Capture participant progress data and outcomes over time.
3. Present transparent, reliable impact metrics to funders and financial stakeholders.
4. Give administrators a central place to manage participant responses, funder communications, and marketing outreach.
5. Provide separate, role-specific views for each stakeholder type.

## Required User Roles and Views

Implement authentication and role-based access with at least these roles:

1. Participant
2. Administrator
3. Funder/Financier Stakeholder

### 1) Participant View

Participants can:

- View their profile and cohort details.
- Receive messages/check-ins from the accelerator team.
- Submit periodic updates (for example: business milestones, revenue ranges, jobs created, funding raised, challenges, support needed).
- Complete forms/surveys sent by administrators.
- View communication history between themselves and program staff.

### 2) Administrator View

Administrators can:

- Create and manage participant records.
- Send individual or bulk check-ins/messages to participants.
- Build and schedule recurring update forms/surveys.
- Review all participant responses in a searchable table.
- Tag or categorize responses by theme (growth, hiring, funding, risk, etc.).
- Manage communications with funders (notes, updates, status tracking).
- Create and send marketing materials (newsletter-style announcements or campaign messages) to selected audiences.
- Export key reporting data (CSV).

### 3) Funder/Financier Stakeholder View

Funders can:

- View a dashboard of aggregate program performance metrics.
- Filter results by date range, cohort, and program.
- Review trend summaries (month-over-month/quarter-over-quarter where applicable).
- See anonymized participant insights where needed for privacy.
- Access communication updates intended for funders.

## Core Features

1. Authentication and Authorization
- Secure login/logout.
- Role-based route protection and UI rendering.

2. Messaging and Check-ins
- Admin-to-participant messaging.
- Conversation history.
- Status for check-ins (sent, responded, overdue).

3. Data Collection
- Dynamic forms/surveys managed by admins.
- Participant submissions saved with timestamps.

4. Metrics and Reporting
- KPI cards and simple charts (can use lightweight chart library or custom SVG/canvas).
- Example KPIs: response rate, active participants, milestone completion rate, jobs created, revenue growth bands, capital raised.

5. Stakeholder Communication Log
- Track messages/updates sent to funders.
- Record date, owner, summary, and follow-up status.

6. Marketing Materials
- Admin can draft and send campaign content.
- Track audience segment and send date.

## Suggested SQLite Schema

Create normalized tables (at minimum):

- users (id, name, email, password_hash, role, created_at)
- participants (id, user_id, cohort, company_name, industry, joined_at, status)
- checkins (id, participant_id, subject, message, sent_by, sent_at, due_at, status)
- responses (id, checkin_id, participant_id, payload_json, submitted_at)
- surveys (id, title, description, created_by, created_at, is_active)
- survey_questions (id, survey_id, question_text, question_type, required, sort_order)
- survey_submissions (id, survey_id, participant_id, submitted_at)
- survey_answers (id, submission_id, question_id, answer_text)
- metrics_snapshots (id, cohort, period_start, period_end, metric_key, metric_value, captured_at)
- funder_updates (id, title, summary, audience, sent_by, sent_at, follow_up_status)
- marketing_campaigns (id, title, content, audience_segment, created_by, sent_at, status)
- communication_logs (id, entity_type, entity_id, channel, direction, subject, body, created_by, created_at)

## API Requirements

Provide RESTful endpoints for:

- auth (login/logout/me)
- participants CRUD
- check-ins CRUD + submit response
- surveys CRUD + submission endpoints
- metrics aggregation endpoints for dashboards
- funder updates CRUD
- marketing campaigns CRUD/send

Include input validation and consistent JSON response structure.

## UI/UX Requirements

- Clean, modern dashboard layout.
- Responsive design for desktop and tablet.
- Clear left navigation by role.
- Reusable components using plain HTML templates and vanilla JS modules.
- Accessible forms (labels, validation hints, keyboard navigability).

## Security and Privacy

- Hash passwords using bcrypt.
- Protect sensitive routes.
- Enforce least-privilege access by role.
- Avoid exposing participant-level sensitive data to funders unless explicitly allowed.
- Add basic audit trails for critical actions (message sent, campaign sent, report exported).

## Seed Data

Provide SQLite seed scripts with:

- Sample admin, participant, and funder accounts.
- At least 15 participant records across multiple cohorts.
- Sample check-ins, responses, and funder updates.
- Sample marketing campaign drafts.

## Deliverables

1. Working application codebase.
2. SQL schema and seed files.
3. README with setup instructions and run commands.
4. Brief architecture notes.

## Success Criteria

- Each role sees a distinct, appropriate dashboard.
- Admin can send check-ins and view participant responses.
- Participant can submit updates successfully.
- Funder can view aggregated impact metrics and status updates.
- Marketing and funder communication workflows are functional end-to-end.
