import mongoose from 'mongoose'
import { env } from './env'
import { logger } from '../utils/logger'

let isConnected = false

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) return

  await mongoose.connect(env.mongoUri, {
    maxPoolSize: 50,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    maxIdleTimeMS: 600000,
  })

  isConnected = true
  logger.info('MongoDB connected')
}
