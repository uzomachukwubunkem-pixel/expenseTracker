import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'
import { env } from './config/env'
import { errorHandler } from './middleware/errorHandler'
import { notFoundHandler } from './middleware/notFound'
import { apiRateLimiter } from './middleware/rateLimiter'
import { authRouter } from './routes/authRoutes'
import { auditRouter } from './routes/auditRoutes'
import { expenseRouter } from './routes/expenseRoutes'
import { invoiceRouter } from './routes/invoiceRoutes'
import { reportRouter } from './routes/reportRoutes'
import { userRouter } from './routes/userRoutes'

export const app = express()

app.disable('x-powered-by')
if (env.trustProxy) {
  app.set('trust proxy', 1)
}

const allowedOrigins = env.corsAllowedOrigins.length > 0 ? env.corsAllowedOrigins : [env.frontendUrl]

app.use(helmet())
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true)
        return
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true)
        return
      }

      callback(new Error('CORS origin not allowed'))
    },
    credentials: true,
  }),
)
app.use(morgan('tiny'))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(apiRateLimiter)

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok' } })
})

app.use('/api/v1/auth', authRouter)
app.use('/api/v1/expenses', expenseRouter)
app.use('/api/v1/invoices', invoiceRouter)
app.use('/api/v1/reports', reportRouter)
app.use('/api/v1/audit-logs', auditRouter)
app.use('/api/v1/users', userRouter)

app.use(notFoundHandler)
app.use(errorHandler)
