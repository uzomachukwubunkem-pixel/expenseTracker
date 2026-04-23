# ExpenseTracker NG

TypeScript full-stack expense and tax operations platform for Nigerian businesses.

## What This App Does

ExpenseTracker NG helps teams:

- Capture and manage expenses
- Generate invoices
- Track turnover against VAT/CIT thresholds
- Monitor tax posture (VAT, CIT, presumptive tax)
- Export VAT returns (JSON, Excel, PDF)
- Keep an audit trail of critical actions
- Manage staff access with role-based controls

## Tech Stack

### Backend

- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT access/refresh token auth
- Zod validation
- Helmet + CORS + rate limiting

### Frontend

- React + Vite + TypeScript
- Redux Toolkit + RTK Query
- Role-aware UI and auth bootstrap with refresh flow

### Shared Package

- Tax constants
- Domain types
- Validation schemas/utilities

## Monorepo Layout

- `backend/` API and business logic
- `frontend/` Web client
- `shared/` Reusable types/schemas/constants
- `openapi.yaml` API contract starter
- `docker-compose.yml` local container orchestration

## Core Features

### 1. Authentication and Session Management

- Register, login, logout, refresh, profile (`/auth/me`)
- Email verification flow
- Password reset flow
- Refresh token rotation with hashed token persistence
- `401` handling for missing/invalid/expired refresh tokens

### 2. Role and Company Access Control

- Roles: `admin`, `staff`
- Company-scoped user management
- Admin-only staff role/status management
- Last active admin protection

### 3. Company Onboarding and Company ID Flow

Current behavior:

- Staff registration requires an existing `companyId`
- Admin account registration does not create a shareable company ID
- Admin receives a temporary internal company marker at account creation
- Real shareable company ID is generated when admin completes company setup (`PUT /reports/company-settings`)
- Generated company ID is surfaced in the app UI for quick sharing with staff

Why this flow exists:

- Prevents accidental company creation during mere account signup
- Aligns company identity creation with explicit company onboarding

### 4. Expense and Invoice Operations

- Expense CRUD with filtering/pagination
- Invoice creation with sequence tracking
- Company turnover updates as financial records evolve

### 5. Tax and Reporting

- Tax summary across selectable periods
- VAT return generation and export (JSON, Excel, PDF)
- CIT return endpoint by year
- Alert generation for threshold/turnover events
- Company settings management (admin-only updates)

### 6. Audit and Compliance

- Audit log endpoints
- User-change audit entries for sensitive role/status changes

## API Surface (High-Level)

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/send-verification-code`
- `POST /api/v1/auth/verify-email-code`
- `POST /api/v1/auth/request-password-reset`
- `POST /api/v1/auth/reset-password`

### Expenses / Invoices

- `GET /api/v1/expenses`
- `POST /api/v1/expenses`
- `PUT /api/v1/expenses/:id`
- `DELETE /api/v1/expenses/:id`
- `POST /api/v1/invoices`

### Reports / Tax

- `GET /api/v1/reports/tax-summary`
- `GET /api/v1/reports/vat-return?format=json|excel|pdf`
- `GET /api/v1/reports/cit-return?year=YYYY`
- `GET /api/v1/reports/alerts`
- `GET /api/v1/reports/company-settings`
- `PUT /api/v1/reports/company-settings` (admin only)

### Admin / Audit

- `GET /api/v1/users` (admin only)
- `PATCH /api/v1/users/:id/role` (admin only)
- `PATCH /api/v1/users/:id/status` (admin only)
- `GET /api/v1/audit-logs`

## Tax Constants (Shared)

Defined in `shared/src/constants/taxConfig.ts`.

- VAT rate: 7.5%
- VAT threshold: N50,000,000
- CIT/WHT threshold: N100,000,000
- Presumptive threshold: N12,000,000
- Presumptive rate: 0.5%
- CGT rate: 30%

## Local Development

### Prerequisites

- Node.js 22+
- npm
- MongoDB (local or Atlas)

### Install

```bash
npm install --prefix shared
npm install --prefix backend
npm install --prefix frontend
```

### Run

```bash
npm run dev --prefix backend
npm run dev --prefix frontend
```

### Docker

```bash
docker compose up --build
```

## Environment Variables (Backend)

Critical runtime vars include:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `NODE_ENV`
- `PORT`
- `COOKIE_SECURE`
- `TRUST_PROXY`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- SMTP vars for email flows (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`)

## Deployment Notes

- Backend currently targets Azure Container Apps in project workflows.
- Keep backend env vars synchronized on every deploy (image + env update) to avoid config drift.
- The deployment workflow resolves the live frontend Container App URL and feeds it back into `FRONTEND_URL` and `CORS_ALLOWED_ORIGINS` so CORS stays aligned with the deployed frontend origin.
- Ensure MongoDB Atlas network access allows Container Apps egress.
- Validate CORS with explicit OPTIONS checks after each deploy.

## Testing

Backend tests:

- Unit: `backend/tests/unit`
- Integration: `backend/tests/integration`

Run:

```bash
npm run test --prefix backend
```

## Documentation Maintenance Checklist

When you add or modify features, update this README in the same PR:

1. Update feature list
2. Update auth/role/company flow sections
3. Update API endpoint list if routes changed
4. Update env var list if config changed
5. Update deployment notes if infra behavior changed

This checklist is here so the README stays current with each release.
