# API Testing & Integration Guide

## Overview
This document provides curl examples and payloads for testing all API endpoints.

## Prerequisites
- Backend running on `http://localhost:5000`
- curl or Postman
- Test user credentials

---

## 1. Authentication Flow

### 1.1 Register User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@company.com",
    "password": "SecurePass123!@#",
    "name": "Alice Johnson"
  }'
```

**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "user_id_123",
    "email": "alice@company.com",
    "name": "Alice Johnson",
    "role": "staff"
  }
}
```

### 1.2 Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@company.com",
    "password": "SecurePass123!@#"
  }'
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_id_123",
      "email": "alice@company.com",
      "role": "staff"
    }
  }
}
```

**Note**: Refresh token is set in HTTP-only cookie automatically.

### 1.3 Get Current User

```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer {accessToken}"
```

### 1.4 Refresh Access Token

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Authorization: Bearer {expiredAccessToken}"
```

Returns new `accessToken`.

### 1.5 Logout

```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer {accessToken}"
```

Invalidates refresh token in database.

---

## 2. Expense Management

### 2.1 Create Expense

```bash
curl -X POST http://localhost:5000/api/v1/expenses \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 250000,
    "category": "office_supplies",
    "description": "Purchased 10 office chairs",
    "date": "2026-04-10"
  }'
```

**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "expense_id",
    "user": "user_id_123",
    "amount": 250000,
    "amountExcludingVAT": 232558,
    "inputVAT": 17500,
    "category": "office_supplies",
    "description": "Purchased 10 office chairs",
    "date": "2026-04-10T00:00:00.000Z",
    "createdAt": "2026-04-15T14:30:00Z",
    "deletedAt": null
  }
}
```

**Auto-Calculated**: `inputVAT = amount * 0.075` (7.5%)

### 2.2 List Expenses

```bash
curl -X GET "http://localhost:5000/api/v1/expenses?page=1&limit=10" \
  -H "Authorization: Bearer {accessToken}"
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "expenses": [ /* array of expense objects */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### 2.3 Update Expense

```bash
curl -X PUT http://localhost:5000/api/v1/expenses/{expenseId} \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 300000,
    "description": "Updated: Purchased 15 office chairs"
  }'
```

**Note**: Each update creates an audit trail entry with previous values.

### 2.4 Delete Expense (Soft Delete)

```bash
curl -X DELETE http://localhost:5000/api/v1/expenses/{expenseId} \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (200):
```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

**Note**: Sets `deletedAt` timestamp; expense still in database for audit trail.

---

## 3. Invoice Management

### 3.1 Create Invoice

```bash
curl -X POST http://localhost:5000/api/v1/invoices \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{
    "buyerName": "ABC Corporation Limited",
    "buyerTIN": "12345678901",
    "buyerAddress": "Lagos, Nigeria",
    "sellerName": "Your Company Ltd",
    "sellerTIN": "98765432101",
    "sellerAddress": "Abuja, Nigeria",
    "amount": 500000,
    "description": "Professional Services",
    "date": "2026-04-15"
  }'
```

**Expected Response** (201):
```json
{
  "success": true,
  "data": {
    "id": "invoice_id",
    "invoiceNumber": "INV-000001",
    "user": "user_id_123",
    "buyerName": "ABC Corporation Limited",
    "buyerTIN": "12345678901",
    "sellerName": "Your Company Ltd",
    "sellerTIN": "98765432101",
    "amount": 500000,
    "vatAmount": 37500,
    "totalAmount": 537500,
    "description": "Professional Services",
    "date": "2026-04-15T00:00:00.000Z",
    "status": "draft",
    "createdAt": "2026-04-15T14:35:00Z"
  }
}
```

**Features**:
- FIRS MBS compatible format
- Sequential invoice numbering
- Auto VAT calculation (7.5%)
- Draft status for modifications before submission

---

## 4. Reports & Tax Calculations

### 4.1 Get Tax Summary

```bash
curl -X GET "http://localhost:5000/api/v1/reports/tax-summary?start=2026-01-01&end=2026-03-31" \
  -H "Authorization: Bearer {adminAccessToken}"
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2026-01-01",
      "end": "2026-03-31"
    },
    "vat": {
      "status": "liable",
      "threshold": 50000000,
      "turnover": 2500000,
      "inputVAT": 187500,
      "outputVAT": 0,
      "balance": 187500
    },
    "cit": {
      "status": "exempt",
      "threshold": 100000000,
      "turnover": 2500000,
      "liability": 0,
      "reason": "Turnover below ₦100M threshold"
    },
    "wht": {
      "status": "not_applicable",
      "threshold": 100000000,
      "amount": 0
    },
    "presumptive": {
      "status": "not_applicable",
      "threshold": 12000000,
      "rate": 0.005,
      "amount": 0
    }
  }
}
```

### 4.2 Generate VAT Return (Excel)

```bash
curl -X GET "http://localhost:5000/api/v1/reports/vat-return?format=excel&period=Q1&year=2026" \
  -H "Authorization: Bearer {adminAccessToken}" \
  -o vat-return-Q1-2026.xlsx
```

**File Contents**:
- Invoice list with dates, buyer names, amounts
- VAT calculations per invoice
- Cumulative totals by week/month
- Excel formatting with currency and date formatting

### 4.3 Generate VAT Return (PDF)

```bash
curl -X GET "http://localhost:5000/api/v1/reports/vat-return?format=pdf&period=Q1&year=2026" \
  -H "Authorization: Bearer {adminAccessToken}" \
  -o vat-return-Q1-2026.pdf
```

### 4.4 Generate CIT Return

```bash
curl -X GET "http://localhost:5000/api/v1/reports/cit-return?year=2026" \
  -H "Authorization: Bearer {adminAccessToken}"
```

**Response includes**:
- Profit calculation (revenue - expenses)
- Tax liability (if applicable)
- Exemption status and reasoning

### 4.5 View Turnover Alerts

```bash
curl -X GET http://localhost:5000/api/v1/reports/alerts \
  -H "Authorization: Bearer {adminAccessToken}"
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "alert_id",
      "type": "VAT",
      "threshold": 45000000,
      "currentTurnover": 42500000,
      "percentageUsed": 94.4,
      "message": "Approaching VAT registration threshold",
      "createdAt": "2026-04-15T10:00:00Z"
    },
    {
      "id": "alert_id_2",
      "type": "PRESUMPTIVE",
      "threshold": 12000000,
      "currentTurnover": 10800000,
      "percentageUsed": 90,
      "message": "Approaching presumptive tax threshold",
      "createdAt": "2026-04-15T10:00:00Z"
    }
  ]
}
```

---

## 5. Audit Trails

### 5.1 List Audit Logs

```bash
curl -X GET http://localhost:5000/api/v1/audit-logs \
  -H "Authorization: Bearer {adminAccessToken}"
```

**Expected Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "log_id",
      "action": "UPDATE",
      "collection": "Expense",
      "documentId": "expense_id_123",
      "userId": "user_id_123",
      "changes": {
        "previous": {
          "amount": 250000,
          "description": "Original description"
        },
        "new": {
          "amount": 300000,
          "description": "Updated: Purchased 15 office chairs"
        }
      },
      "timestamp": "2026-04-15T14:40:00Z"
    },
    {
      "id": "log_id_2",
      "action": "CREATE",
      "collection": "Expense",
      "documentId": "expense_id_123",
      "userId": "user_id_123",
      "changes": {
        "new": {
          "amount": 250000,
          "category": "office_supplies",
          "inputVAT": 17500
        }
      },
      "timestamp": "2026-04-15T14:30:00Z"
    }
  ]
}
```

**Features**:
- Immutable audit trail
- Shows previous and new values for each change
- Timestamp and user ID for accountability
- All actions (CREATE, UPDATE, DELETE) logged

---

## 6. Error Handling

### 6.1 Validation Errors

**Request**:
```bash
curl -X POST http://localhost:5000/api/v1/expenses \
  -H "Authorization: Bearer {accessToken}" \
  -H "Content-Type: application/json" \
  -d '{"amount": -100}' # Invalid: negative amount
```

**Response** (400):
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "amount",
      "message": "Must be positive number"
    }
  ]
}
```

### 6.2 Authentication Errors

**Missing token**:
```bash
curl http://localhost:5000/api/v1/expenses
```

**Response** (401):
```json
{
  "success": false,
  "message": "Unauthorized"
}
```

### 6.3 Permission Errors

**Non-admin trying to access admin endpoint**:
```bash
curl http://localhost:5000/api/v1/reports/tax-summary \
  -H "Authorization: Bearer {staffAccessToken}"
```

**Response** (403):
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 6.4 Not Found Errors

**Non-existent expense**:
```bash
curl http://localhost:5000/api/v1/expenses/invalid-id \
  -H "Authorization: Bearer {accessToken}"
```

**Response** (404):
```json
{
  "success": false,
  "message": "Expense not found"
}
```

---

## 7. Tax Calculation Examples

### Example 1: Small Company (VAT Only)
**Turnover**: ₦25,000,000
**Expense**: ₦100,000

```
Input VAT = ₦100,000 × 7.5% = ₦7,500
CIT Status: EXEMPT (≤ ₦100M)
WHT Status: NOT APPLICABLE
Presumptive Status: LIABLE (≤ ₦12M? No)
```

### Example 2: Medium Company (VAT + CIT)
**Turnover**: ₦150,000,000
**Profit**: ₦25,000,000

```
VAT Status: LIABLE (> ₦50M)
Input VAT: Claimable
CIT Status: LIABLE (> ₦100M)
CIT Liability = ₦25,000,000 × 20% = ₦5,000,000
WHT: MAY APPLY (> ₦100M)
```

### Example 3: Micro Business (Presumptive Tax)
**Turnover**: ₦8,000,000

```
Presumptive Tax = ₦8,000,000 × 0.5% = ₦40,000
Alternative to CIT
Simpler compliance
```

---

## 8. Bulk Operations & Imports

### 8.1 Import Expenses from CSV

**Create `expenses.csv`**:
```csv
amount,category,description,date
100000,office_supplies,Printer,2026-04-01
250000,travel,Flight tickets,2026-04-05
50000,utilities,Electricity bill,2026-04-10
```

**Process with curl loop**:
```bash
tail -n +2 expenses.csv | while IFS=',' read amount category description date; do
  curl -X POST http://localhost:5000/api/v1/expenses \
    -H "Authorization: Bearer {accessToken}" \
    -H "Content-Type: application/json" \
    -d "{
      \"amount\": $amount,
      \"category\": \"$category\",
      \"description\": \"$description\",
      \"date\": \"$date\"
    }"
done
```

---

## 9. Performance Testing

### 9.1 Paginated List Request

```bash
# Get page 5 with 50 items per page
curl -X GET "http://localhost:5000/api/v1/expenses?page=5&limit=50" \
  -H "Authorization: Bearer {accessToken}"
```

### 9.2 Large Date Range Report

```bash
curl -X GET "http://localhost:5000/api/v1/reports/tax-summary?start=2020-01-01&end=2026-04-15" \
  -H "Authorization: Bearer {adminAccessToken}"
```

---

## 10. Postman Collection

Save as `Expense_Tracker.postman_collection.json`:

```json
{
  "info": {
    "name": "Expense Tracker API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Auth - Register",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/v1/auth/register",
        "header": [
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"test@example.com\", \"password\": \"Pass123!\", \"name\": \"Test User\"}"
        }
      }
    },
    {
      "name": "Expense - Create",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/v1/expenses",
        "header": [
          {"key": "Authorization", "value": "Bearer {{accessToken}}"},
          {"key": "Content-Type", "value": "application/json"}
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"amount\": 250000, \"category\": \"office_supplies\", \"description\": \"Test\", \"date\": \"2026-04-15\"}"
        }
      }
    }
  ]
}
```

---

## Useful Links

- **Postman Download**: https://www.postman.com/downloads/
- **API Docs (OpenAPI)**: See `openapi.yaml` in root directory
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas
- **Nigerian Tax Info**: https://www.firs.gov.ng/tax-rates

