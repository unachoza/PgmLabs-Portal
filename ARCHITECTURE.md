# Architecture Notes

## Stack

- Frontend: Vanilla HTML, CSS, JavaScript modules
- Backend: Node.js + Express
- Database: SQLite (better-sqlite3)
- Auth: JWT bearer token

## High-Level Structure

- src/server.js: Express server, REST endpoints, static hosting
- src/db.js: SQLite connection and schema migrations
- src/middleware/auth.js: Authentication and role checks
- src/public/index.html: Single-page shell
- src/public/js/app.js: Role-based dashboard rendering and API integration
- src/public/css/styles.css: Visual design and responsive layout
- scripts/init-db.js: Schema initialization command
- scripts/seed-db.js: Seed dataset for admin, funder, and participant flows

## Request Flow

1. User logs in at /api/auth/login and receives a JWT token.
2. Frontend stores token in localStorage.
3. Frontend sends Authorization: Bearer token for protected routes.
4. Middleware verifies token and role.
5. Route handlers query SQLite and return JSON responses.

## Role Model

- admin:
  - Manage participants
  - Send check-ins
  - Review responses
  - Publish funder updates
  - Create and send marketing campaigns
- participant:
  - View own profile/check-ins
  - Submit check-in responses
  - View active surveys
- funder:
  - View aggregate metrics
  - View funder updates

## Data and Reporting

- Check-ins represent participant outreach messages.
- Responses store participant-submitted JSON payloads.
- Metrics endpoint computes aggregate KPIs from participants, check-ins, and responses.
- CSV export endpoint provides reporting-friendly output for submitted responses.

## Security Notes

- Passwords are hashed with bcrypt.
- JWT is required for protected routes.
- Role checks enforce least-privilege access.
- Funder endpoints are aggregate-focused and do not expose full participant-level raw records by default.
