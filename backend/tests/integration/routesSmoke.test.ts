import request from 'supertest'
import mongoose from 'mongoose'
import crypto from 'node:crypto'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { app } from '../../src/app'
import { UserModel } from '../../src/models/User'

let mongoServer: MongoMemoryServer

jest.setTimeout(30000)

const makeVerificationCodeHash = (code: string): string =>
  crypto.createHash('sha256').update(code).digest('hex')

const createSession = async (payload: {
  name: string
  email: string
  password: string
  companyId: string
  role?: 'admin' | 'staff'
}) => {
  const registerResponse = await request(app).post('/api/v1/auth/register').send(payload)
  expect(registerResponse.status).toBe(201)

  const verificationCode = '123456'
  await UserModel.updateOne(
    { email: payload.email },
    {
      $set: {
        isEmailVerified: true,
        emailVerificationCodeHash: makeVerificationCodeHash(verificationCode),
        emailVerificationCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    },
  )

  const verifyResponse = await request(app).post('/api/v1/auth/verify-email-code').send({
    email: payload.email, 
    code: verificationCode,
  })
  expect(verifyResponse.status).toBe(200)

  const loginResponse = await request(app).post('/api/v1/auth/login').send({
    email: payload.email,
    password: payload.password,
  })

  expect(loginResponse.status).toBe(200)
  const token = loginResponse.body.data.accessToken as string
  const userId = loginResponse.body.data.user?.id as string
  const refreshCookie = loginResponse.headers['set-cookie']?.[0]

  return { token, userId, refreshCookie }
}

describe('route smoke tests', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  it('covers auth, expense, invoice, report, and audit routes', async () => {
    const admin = await createSession({
      name: 'Smoke Admin',
      email: 'admin@example.com',
      password: 'Test123!@#',
      companyId: 'company-a',
      role: 'admin',
    })

    const staff = await createSession({
      name: 'Smoke Staff',
      email: 'staff@example.com',
      password: 'Test123!@#',
      companyId: 'company-a',
      role: 'staff',
    })

    const otherCompanyAdmin = await createSession({
      name: 'Other Admin',
      email: 'other-admin@example.com',
      password: 'Test123!@#',
      companyId: 'company-b',
      role: 'admin',
    })

    const meResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${staff.token}`)
    expect(meResponse.status).toBe(200)

    const refreshResponse = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', staff.refreshCookie ?? '')
    expect(refreshResponse.status).toBe(200)

    const logoutResponse = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${staff.token}`)
      .set('Cookie', staff.refreshCookie ?? '')
    expect(logoutResponse.status).toBe(200)

    const companySettingsResponse = await request(app)
      .put('/api/v1/reports/company-settings')
      .set('Authorization', `Bearer ${staff.token}`)
      .send({ legalName: 'Smoke Test Ltd', taxId: 'TIN123456', yearlyTurnover: 2500000 })
    expect(companySettingsResponse.status).toBe(200)

    const taxSummaryResponse = await request(app)
      .get('/api/v1/reports/tax-summary')
      .set('Authorization', `Bearer ${staff.token}`)
      .query({ start: '2026-01-01', end: '2026-12-31' })
    expect(taxSummaryResponse.status).toBe(200)

    const vatReturnResponse = await request(app)
      .get('/api/v1/reports/vat-return')
      .set('Authorization', `Bearer ${admin.token}`)
      .query({ format: 'json', start: '2026-01-01', end: '2026-12-31' })
    expect(vatReturnResponse.status).toBe(200)

    const citReturnResponse = await request(app)
      .get('/api/v1/reports/cit-return')
      .set('Authorization', `Bearer ${admin.token}`)
      .query({ year: 2026 })
    expect(citReturnResponse.status).toBe(200)

    const alertsResponse = await request(app)
      .get('/api/v1/reports/alerts')
      .set('Authorization', `Bearer ${admin.token}`)
    expect(alertsResponse.status).toBe(200)

    const expenseCreateResponse = await request(app)
      .post('/api/v1/expenses')
      .set('Authorization', `Bearer ${staff.token}`)
      .send({
        amount: 107500,
        description: 'Stationery and supplies',
        category: 'Office',
        date: '2026-04-15',
      })
    expect(expenseCreateResponse.status).toBe(201)

    const expenseId = expenseCreateResponse.body.data._id ?? expenseCreateResponse.body.data.id
    expect(expenseId).toBeTruthy()

    const expenseUpdateResponse = await request(app)
      .put(`/api/v1/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${staff.token}`)
      .send({
        amount: 107500,
        description: 'Stationery and office supplies',
        category: 'Office',
        date: '2026-04-15',
      })
    expect(expenseUpdateResponse.status).toBe(200)

    const expenseDeleteResponse = await request(app)
      .delete(`/api/v1/expenses/${expenseId}`)
      .set('Authorization', `Bearer ${staff.token}`)
    expect(expenseDeleteResponse.status).toBe(200)

    const invoiceResponse = await request(app)
      .post('/api/v1/invoices')
      .set('Authorization', `Bearer ${staff.token}`)
      .send({
        buyerName: 'Buyer Ltd',
        buyerTaxId: 'BUYER12345',
        sellerName: 'Smoke Test Ltd',
        sellerTaxId: 'TIN123456',
        total: 250000,
        issuedAt: '2026-04-15',
      })
    expect(invoiceResponse.status).toBe(201)

    const auditResponse = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${admin.token}`)
    expect(auditResponse.status).toBe(200)

    const invalidRoleAuditResponse = await request(app)
      .get('/api/v1/audit-logs')
      .set('Authorization', `Bearer ${staff.token}`)
    expect(invalidRoleAuditResponse.status).toBe(403)

    const usersListResponse = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${admin.token}`)
      .query({ role: 'staff' })
    expect(usersListResponse.status).toBe(200)
    expect(usersListResponse.body.data.items).toHaveLength(1)
    expect(usersListResponse.body.data.items[0].email).toBe('staff@example.com')

    const crossCompanyListResponse = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${otherCompanyAdmin.token}`)
      .query({ role: 'staff' })
    expect(crossCompanyListResponse.status).toBe(200)
    expect(crossCompanyListResponse.body.data.items).toHaveLength(0)

    const usersListForbiddenResponse = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${staff.token}`)
    expect(usersListForbiddenResponse.status).toBe(403)

    const promoteStaffResponse = await request(app)
      .patch(`/api/v1/users/${staff.userId}/role`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ role: 'admin' })
    expect(promoteStaffResponse.status).toBe(200)

    const deactivateUserResponse = await request(app)
      .patch(`/api/v1/users/${staff.userId}/status`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ isActive: false })
    expect(deactivateUserResponse.status).toBe(200)
  })
})