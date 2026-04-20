# Complete Setup and Deployment Guide

## Quick Start

### Prerequisites

- Node.js 22+
- MongoDB (Atlas cluster or local)
- Docker & Docker Compose (optional, for containerized setup)
- Git

### 1. Clone & Install Dependencies

```bash
cd expenseTracker
npm install --prefix shared
npm install --prefix backend
npm install --prefix frontend
```

### 2. Environment Configuration

Security baseline:

- Copy from `.env.example` files and keep real `.env` files local only.
- Never commit real secrets (database URIs, JWT secrets, OAuth tokens) to version control.
- Rotate secrets immediately if they are ever exposed.
- In production, set `COOKIE_SECURE=true`, configure `CORS_ALLOWED_ORIGINS`, and enable `TRUST_PROXY=true` behind reverse proxies.

**Backend Setup** (`backend/.env`):

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.imoxh08.mongodb.net/?appName=Cluster0

# JWT Secrets (generate unique values for your environment)
JWT_ACCESS_SECRET=<generate-with-crypto-random-32-byte-hex>
JWT_REFRESH_SECRET=<generate-with-crypto-random-32-byte-hex>

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

COOKIE_SECURE=false  # Set to 'true' in production with HTTPS

# Email Config (choose one approach)
# Gmail OAuth2 (recommended)
EMAIL_USER=your_email@gmail.com
EMAIL_CLIENT_ID=your_google_client_id
EMAIL_CLIENT_SECRET=your_google_client_secret
EMAIL_REFRESH_TOKEN=your_google_refresh_token
EMAIL_ACCESS_TOKEN=your_google_access_token
EMAIL_REDIRECT_URI=https://developers.google.com/oauthplayground

# Or traditional SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=noreply@expensetracker.com
```

**Frontend Setup** (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5000/api/v1
```

### 3. Start Development Servers

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### 4. Verify Setup

#### Backend Health Check:

```bash
curl http://localhost:5000/health
# Expected: { "success": true }
```

#### Test User Registration:

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "name": "Test User"
  }'
```

If email delivery is not configured yet, registration still succeeds and the backend logs a warning instead of crashing. Once the mail env vars are added, verification emails will be sent automatically.

In development (`NODE_ENV=development`) without SMTP/OAuth configured, the backend now logs a fallback message with the generated verification code and password reset URL so you can continue testing the flow locally.

---

## Docker Deployment

### Single Command Startup:

```bash
docker-compose up --build
```

### Accessing Containerized App:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api/v1
- **MongoDB**: localhost:27017

### Stopping Containers:

```bash
docker-compose down

# Clean up volumes
docker-compose down -v
```

---

## API Documentation

### Authentication Endpoints

#### Register User

```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "companyId": "acme-ng",
  "role": "staff"
}

Response:
{
  "success": true,
  "data": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "staff"
  }
}

Notes:
- Registration supports both staff and admin roles.
- `companyId` is optional.
- If omitted, a personal workspace company is created automatically.
- If provided for staff, it must match an existing company ID.
- Admin users can promote staff accounts using the user management endpoints.
```

#### Login

```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

Response:
{
  "success": true,
  "data": {
    "accessToken": "jwt_token",
    "user": { ... }
  }
```

#### Refresh Token

```bash
POST /api/v1/auth/refresh
Authorization: Bearer {accessToken}
```

#### Request Password Reset

```bash
POST /api/v1/auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password

```bash
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "token": "reset-token-from-email",
  "password": "NewSecurePass123!"
}
```

### Expense Endpoints (Protected)

#### Create Expense

```bash
POST /api/v1/expenses
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "amount": 100000,
  "category": "office_supplies",
  "description": "Laptop purchase",
  "date": "2026-04-15"
}

Response includes auto-calculated inputVAT (7500)
```

#### List Expenses

```bash
GET /api/v1/expenses?page=1&limit=20
Authorization: Bearer {accessToken}
```

#### Update Expense

```bash
PUT /api/v1/expenses/:id
Authorization: Bearer {accessToken}
```

#### Delete Expense (Soft Delete)

```bash
DELETE /api/v1/expenses/:id
Authorization: Bearer {accessToken}
```

### Invoice Endpoints

#### Create Invoice

```bash
POST /api/v1/invoices
Authorization: Bearer {accessToken}

{
  "buyerName": "Client Company",
  "buyerTIN": "12345678901",
  "sellerName": "Your Company",
  "sellerTIN": "98765432101",
  "amount": 500000,
  "description": "Service invoice"
}
```

### Report Endpoints (Admin Only)

#### Get Tax Summary

```bash
GET /api/v1/reports/tax-summary?start=2026-01-01&end=2026-03-31
Authorization: Bearer {adminToken}
```

Response includes:

- VAT input/output/balance
- CIT calculation status
- WHT summary
- Presumptive tax liability

#### Generate VAT Return

```bash
GET /api/v1/reports/vat-return?format=excel&start=2026-Q1&end=2026-Q1
Authorization: Bearer {adminToken}

Returns Excel file with:
- Invoice list by period
- VAT calculations
- Cumulative totals
```

#### View Alerts

```bash
GET /api/v1/reports/alerts
Authorization: Bearer {adminToken}

Returns alerts when turnover approaches thresholds:
- 90% of VAT threshold (₦45M)
- 90% of CIT threshold (₦90M)
```

### Audit Trail Endpoints

#### List Audit Logs

````bash
GET /api/v1/audit-logs
Authorization: Bearer {adminToken}

Returns immutable log of all changes:
- CREATE, UPDATE, DELETE actions
- Previous and new values
- Timestamp
- User who made change

### Admin & Staff Model

- A company can have one or more admins and several staff users.
- Users can register as either staff or admin.
- Admins can only see and manage staff in the same company.
- Admins can promote staff accounts using the Staff Management page.
- Password reset revokes active sessions so lost credentials do not stay usable.

### User Management Endpoints (Admin Only)

#### List Users / Staff

```bash
GET /api/v1/users?role=staff&page=1&limit=25&q=jane
Authorization: Bearer {adminToken}
````

#### Update User Role

```bash
PATCH /api/v1/users/:id/role
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "role": "admin"
}
```

#### Activate/Deactivate User

```bash
PATCH /api/v1/users/:id/status
Authorization: Bearer {adminToken}
Content-Type: application/json

{
  "isActive": false
}
```

````

---

## Tax Calculations Reference

All tax logic is in `shared/src/utils/tax.ts` and used by both backend and frontend:

### VAT (7.5%)

- Applied to all expenses
- Input VAT claimable if registered
- Threshold: ₦50,000,000 annual turnover

```typescript
const inputVAT = amount * 0.075;
````

### CIT (Corporate Income Tax)

- 20% flat rate
- Exemption: Small companies with turnover ≤ ₦100,000,000
- Assessment: Annual
- Status:
  - `exempt`: Turnover ≤ ₦100M
  - `liable`: Turnover > ₦100M

### WHT (Withholding Tax)

- 5% on contractor payments
- 10% on rent
- Threshold: ₦100,000,000 annual turnover

### Presumptive Tax

- For micro businesses
- Threshold: ₦12,000,000 annual turnover
- Rate: 0.5% of turnover
- Alternative to CIT for eligible companies

### CGT (Capital Gains Tax)

- 30% on disposal of capital assets
- Applied when asset value appreciates

---

## Testing

### Unit Tests (Tax Service)

```bash
cd backend
npm run test tests/unit/taxService.test.ts
```

Tests validate:

- VAT computation (7.5% of amount)
- CIT exemption logic (≤ ₦100M)
- Presumptive tax calculation
- WHT thresholds

### Integration Tests (API Flow)

```bash
cd backend
npm run test tests/integration/expenseFlow.test.ts
```

Tests validate:

- User registration → login flow
- Expense creation with VAT auto-calculation
- Audit trail logging
- Permission-based access control

### Run All Tests with Coverage

```bash
cd backend
npm run test -- --coverage
```

---

## Production Deployment

### Microsoft Azure (Container Apps + ACR)

#### GitHub Actions deployment path

Use this when Docker Desktop is unavailable on your machine. GitHub Actions will build the images, push them to Azure Container Registry, and update both Container Apps.

Required GitHub repository secrets:

Repository variables / OIDC values:

- `AZURE_CLIENT_ID` - Azure app registration client ID for OIDC login
- `AZURE_TENANT_ID` - Azure tenant ID
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID
- `AZURE_RESOURCE_GROUP` - Azure resource group name
- `AZURE_BACKEND_APP_NAME` - Backend Container App name
- `AZURE_FRONTEND_APP_NAME` - Frontend Container App name
- `ACR_NAME` - Azure Container Registry name
- `FRONTEND_API_URL` - Public backend API URL used at frontend build time

You also need to create a federated credential on the Azure app registration so GitHub Actions can log in without storing an Azure secret JSON.

Workflow file:

- [`.github/workflows/deploy-azure.yml`](.github/workflows/deploy-azure.yml)

Flow:

1. Push code to `main`.
2. GitHub Actions builds backend and frontend images.
3. GitHub Actions pushes both images to ACR.
4. GitHub Actions updates the backend and frontend Container Apps.
5. You verify the live app with a smoke test.

6. **Create Azure resources**:

```bash
az login
az group create --name rg-expense-prod --location eastus
az acr create --resource-group rg-expense-prod --name expensetrackeracr --sku Basic
az acr login --name expensetrackeracr
az containerapp env create --name ca-env-expense --resource-group rg-expense-prod --location eastus
```

2. **Build and push backend image**:

```bash
docker build -t expensetrackeracr.azurecr.io/expense-backend:1.0.0 ./backend
docker push expensetrackeracr.azurecr.io/expense-backend:1.0.0
```

3. **Build and push frontend image with production API URL**:

```bash
docker build \
  --build-arg VITE_API_URL=https://api.your-domain.com/api/v1 \
  -t expensetrackeracr.azurecr.io/expense-frontend:1.0.0 ./frontend
docker push expensetrackeracr.azurecr.io/expense-frontend:1.0.0
```

4. **Deploy backend Container App**:

```bash
az containerapp create \
  --name expense-backend \
  --resource-group rg-expense-prod \
  --environment ca-env-expense \
  --image expensetrackeracr.azurecr.io/expense-backend:1.0.0 \
  --target-port 5000 \
  --ingress external \
  --registry-server expensetrackeracr.azurecr.io \
  --env-vars \
    NODE_ENV=production \
    PORT=5000 \
    COOKIE_SECURE=true \
    TRUST_PROXY=true \
    FRONTEND_URL=https://app.your-domain.com \
    CORS_ALLOWED_ORIGINS=https://app.your-domain.com \
    MONGODB_URI=<atlas-uri> \
    JWT_ACCESS_SECRET=<access-secret> \
    JWT_REFRESH_SECRET=<refresh-secret> \
    EMAIL_ENABLED=true
```

5. **Deploy frontend Container App**:

```bash
az containerapp create \
  --name expense-frontend \
  --resource-group rg-expense-prod \
  --environment ca-env-expense \
  --image expensetrackeracr.azurecr.io/expense-frontend:1.0.0 \
  --target-port 80 \
  --ingress external \
  --registry-server expensetrackeracr.azurecr.io
```

6. **Configure custom domains + TLS**:
   - Map `api.your-domain.com` to `expense-backend`
   - Map `app.your-domain.com` to `expense-frontend`
   - Enable managed certificates in Azure Container Apps

7. **Run post-deploy checks**:
   - Backend health: `GET /health`
   - Auth flow: register, verify, login, refresh, logout
   - Check Container Apps logs for startup errors

### AWS ECS (Recommended)

1. **Build and Push Docker Images**:

```bash
# Build backend
docker build -t expense-tracker-backend:1.0.0 ./backend
docker tag expense-tracker-backend:1.0.0 YOUR_AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/expense-tracker-backend:1.0.0
docker push YOUR_AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/expense-tracker-backend:1.0.0

# Build frontend
docker build --build-arg VITE_API_URL=https://api.your-domain.com/api/v1 -t expense-tracker-frontend:1.0.0 ./frontend
docker push YOUR_AWS_ACCOUNT.dkr.ecr.REGION.amazonaws.com/expense-tracker-frontend:1.0.0
```

2. **Create RDS MongoDB (Atlas Recommended)**:
   - Use MongoDB Atlas for managed database
   - Create VPC security group to allow ECS access
   - Store connection string in AWS Secrets Manager

3. **Set Environment Variables in ECS**:
   - Store secrets in AWS Secrets Manager
   - Reference in task definition for:
     - `MONGODB_URI`
     - `JWT_ACCESS_SECRET`
     - `JWT_REFRESH_SECRET`
     - `SMTP_*` credentials

4. **Configure ALB (Application Load Balancer)**:
   - Frontend target: Container port 80 (Nginx)
   - Backend target: Container port 5000 (Express)
   - HTTPS listener (SSL/TLS certificate from ACM)
   - Host-based routing or path-based routing

5. **Enable CloudWatch Logging**:

```json
{
  "logDriver": "awslogs",
  "options": {
    "awslogs-group": "/ecs/expense-tracker",
    "awslogs-region": "us-east-1",
    "awslogs-stream-prefix": "ecs"
  }
}
```

### DigitalOcean App Platform

1. **Connect Repository** (GitHub/GitLab)
2. **Create App Spec** (`app.yaml`):

```yaml
name: expense-tracker
services:
  - name: backend
    source:
      type: github
      repo: your-username/expense-tracker
      branch: main
    build_command: npm install && npm run build --prefix backend
    run_command: npm run start --prefix backend
    envs:
      - key: MONGODB_URI
        value: ${db.connection_string}
      - key: JWT_ACCESS_SECRET
        value: ${jwt_access_secret}
    http_port: 5000

  - name: frontend
    source:
      type: github
      repo: your-username/expense-tracker
      branch: main
    build_command: npm install && npm run build --prefix frontend
    run_command: npx serve -s dist
    http_port: 3000

  - name: db
    type: mongodb
    version: "7"
    engine: MONGODB
```

3. **Deploy**:
   - Click "Deploy" in DigitalOcean dashboard
   - Auto-deploys on commits to main branch

### Vercel/Netlify (Frontend Only)

**Frontend Deployment**:

```bash
# Build
npm run build --prefix frontend

# Deploy dist/ folder to Vercel/Netlify
```

**Environment Variable**:

```
VITE_API_URL=https://api.your-domain.com/api/v1
```

---

## Monitoring & Logging

### Winston Logging (Backend)

Logs stored in `backend/logs/`:

- `app.log` - Application logs
- `audit.log` - Audit trail (immutable)

### Sentry Integration (Optional)

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({ dsn: process.env.SENTRY_DSN });
app.use(Sentry.Handlers.errorHandler());
```

### Database Backups (MongoDB Atlas)

- Automated daily snapshots
- Point-in-time recovery available
- Download backups from Atlas UI

---

## Troubleshooting

### Backend won't start

1. Check MongoDB connection: `MONGODB_URI` in `.env`
2. Verify JWT secrets are set (≥32 characters)
3. Check port 5000 is free: `lsof -i :5000`

### Frontend API 404 errors

1. Verify `VITE_API_URL` points to backend
2. Check CORS settings in `backend/src/app.ts`
3. Backend should be running on port 5000

### Test failures

1. Ensure `mongodb-memory-server` installed: `npm install --save-dev mongodb-memory-server`
2. Run with `--forceExit`: `npm run test -- --forceExit`
3. Check Node.js version (should be 20+)

### Docker build fails

1. Clear Docker cache: `docker system prune`
2. Rebuild without cache: `docker-compose build --no-cache`
3. Check Dockerfile syntax in `backend/Dockerfile` and `frontend/Dockerfile`

---

## Security Checklist

- [ ] Change JWT secrets in production (use 32+ character random strings)
- [ ] Set `COOKIE_SECURE=true` with HTTPS
- [ ] Enable MongoDB authentication with strong password
- [ ] Configure CORS `FRONTEND_URL` to match production domain
- [ ] Set up rate limiting thresholds appropriate for your traffic
- [ ] Enable HTTPS/TLS at load balancer
- [ ] Store secrets in environment variables or secret manager
- [ ] Enable MongoDB IP whitelist (Atlas → Network Access)
- [ ] Configure backups and point-in-time recovery
- [ ] Set up error logging/monitoring (Sentry, Datadog)
- [ ] Review Helmet security headers configuration
- [ ] Implement request logging and monitoring

---

## Links & Resources

- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Express.js Docs**: https://expressjs.com
- **React Docs**: https://react.dev
- **Zod Validation**: https://zod.dev
- **Winston Logging**: https://github.com/winstonjs/winston
- **JWT.io**: https://jwt.io
- **Nigerian Tax Info**: https://www.firs.gov.ng

---

## Support & Contact

For issues, questions, or suggestions:

- Open GitHub issue
- Check README.md for API docs
- Review test files for usage examples

---

**Last Updated**: April 17, 2026
