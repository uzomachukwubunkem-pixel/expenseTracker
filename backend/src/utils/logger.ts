import fs from 'node:fs'
import path from 'node:path'
import winston from 'winston'

const logsDir = path.resolve(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  defaultMeta: { service: 'expense-tracker-backend' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: path.join(logsDir, 'app.log') }),
    new winston.transports.File({ filename: path.join(logsDir, 'audit.log'), level: 'info' }),
  ],
})
