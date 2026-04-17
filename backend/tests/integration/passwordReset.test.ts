import request from 'supertest'
import mongoose from 'mongoose'
import crypto from 'node:crypto'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { app } from '../../src/app'
import { UserModel } from '../../src/models/User'

jest.mock('../../src/services/emailService', () => ({
  sendVerificationCodeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}))

let mongoServer: MongoMemoryServer

jest.setTimeout(30000)

const makeVerificationCodeHash = (code: string): string =>
  crypto.createHash('sha256').update(code).digest('hex')

describe('password reset flow', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  it('allows a user to request and complete a password reset', async () => {
    const email = 'reset@example.com'
    const password = 'OldPass123!'
    const newPassword = 'NewPass123!'

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Reset User',
      email,
      password,
      role: 'staff',
    })
    expect(registerResponse.status).toBe(201)

    await UserModel.updateOne(
      { email },
      {
        $set: {
          isEmailVerified: true,
          emailVerificationCodeHash: makeVerificationCodeHash('123456'),
          emailVerificationCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
        },
      },
    )

    const initialLogin = await request(app).post('/api/v1/auth/login').send({ email, password })
    expect(initialLogin.status).toBe(200)

    const requestResetResponse = await request(app)
      .post('/api/v1/auth/request-password-reset')
      .send({ email })
    expect(requestResetResponse.status).toBe(200)

    const user = await UserModel.findOne({ email }).select(
      '+passwordResetTokenHash +passwordResetTokenExpiresAt',
    )
    expect(user).toBeTruthy()
    expect(user?.passwordResetTokenHash).toBeTruthy()

    const resetEmailCalls = jest.requireMock('../../src/services/emailService')
      .sendPasswordResetEmail.mock.calls as Array<[string, string, string]>
    expect(resetEmailCalls.length).toBeGreaterThan(0)

    const resetUrl = resetEmailCalls[0][2]
    const url = new URL(resetUrl)
    const token = url.searchParams.get('token') ?? ''
    expect(token).toBeTruthy()

    const resetResponse = await request(app).post('/api/v1/auth/reset-password').send({
      email,
      token,
      password: newPassword,
    })
    expect(resetResponse.status).toBe(200)

    const oldPasswordLogin = await request(app).post('/api/v1/auth/login').send({ email, password })
    expect(oldPasswordLogin.status).toBe(401)

    const newPasswordLogin = await request(app).post('/api/v1/auth/login').send({
      email,
      password: newPassword,
    })
    expect(newPasswordLogin.status).toBe(200)
  })

  it('allows registration without companyId for personal workspace users', async () => {
    const email = 'solo@example.com'
    const password = 'SoloPass123!'

    const registerResponse = await request(app).post('/api/v1/auth/register').send({
      name: 'Solo User',
      email,
      password,
      role: 'staff',
    })

    expect(registerResponse.status).toBe(201)
    expect(registerResponse.body.data.companyId).toMatch(/^solo-/)

    const savedUser = await UserModel.findOne({ email }).lean()
    expect(savedUser?.companyId).toMatch(/^solo-/)
  })
})
