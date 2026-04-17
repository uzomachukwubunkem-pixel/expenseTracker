# Production-Ready Expense Tracker (MERN + Nigerian Tax Compliance)

## Overview

This project is a TypeScript MERN expense tracker for Nigerian SMEs, including VAT/CIT/WHT/CGT/presumptive logic, turnover monitoring, audit trail, role-based access, and report generation.

## Monorepo Structure

- `backend/` Express + MongoDB API
- `frontend/` React + Vite UI
- `shared/` Reusable tax constants, types, schemas, helpers
- `openapi.yaml` API spec starter

## Setup

1. Install dependencies:
   - `npm install --prefix shared`
   - `npm install --prefix backend`
   - `npm install --prefix frontend`
2. Copy and adjust env:
   - `backend/.env.example`
3. Run services:
   - Backend: `npm run dev --prefix backend`
   - Frontend: `npm run dev --prefix frontend`

## Docker

Run full stack:

- `docker compose up --build`

## API Endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/request-password-reset`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/expenses`
- `POST /api/v1/expenses`
- `PUT /api/v1/expenses/:id`
- `DELETE /api/v1/expenses/:id`
- `POST /api/v1/invoices`
- `GET /api/v1/reports/tax-summary`
- `GET /api/v1/reports/vat-return?format=json|excel|pdf`
- `GET /api/v1/reports/cit-return?year=YYYY`
- `GET /api/v1/reports/alerts`
- `GET /api/v1/audit-logs`
- `GET /api/v1/users` (admin only)
- `PATCH /api/v1/users/:id/role` (admin only)
- `PATCH /api/v1/users/:id/status` (admin only)

## Tax Logic

Shared constants are defined in `shared/src/constants/taxConfig.ts` and reused by backend/frontend.

- VAT rate: 7.5%
- VAT threshold: N50,000,000
- CIT/WHT threshold: N100,000,000
- Presumptive threshold: N12,000,000
- Presumptive rate: 0.5%
- CGT rate: 30%

## Security Controls

- JWT access/refresh strategy with rotation
- HTTP-only refresh token cookie
- bcrypt password hashing (10 rounds)
- Helmet, CORS allowlist, rate limiting
- Validation via shared zod schemas
- Centralized error handling
- Registration supports staff and admin roles
- Admin users can promote staff through user management routes
- Users are scoped to a company via `companyId`
- Admins can only view/manage users in their own company
- Password reset invalidates existing refresh tokens
- Inactive accounts are blocked at login

## Reporting

- VAT return export in JSON, Excel, and PDF
- CIT return endpoint with year-based summary
- Tax summary endpoint for configurable periods

## Testing

Backend:

- Unit: `backend/tests/unit`
- Integration: `backend/tests/integration`

Run:

- `npm run test --prefix backend`

## Deployment Guide (Example)

1. Build Docker images and push to GHCR.
2. Deploy MongoDB + backend + frontend to Render, ECS, or DigitalOcean.
3. Set production env vars in platform secret manager.
4. Enable HTTPS termination at ingress/load balancer.
5. Configure log shipping (Datadog/Logtail/Sentry).
