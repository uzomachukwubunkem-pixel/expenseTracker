import request from 'supertest'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { app } from '../../src/app'

let mongoServer: MongoMemoryServer

describe('expense API flow', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
  })

  afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
  })

  it('health endpoint works', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })
})
