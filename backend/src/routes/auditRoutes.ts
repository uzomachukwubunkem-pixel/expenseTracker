import { Router } from 'express'
import { listAuditLogsHandler } from '../controllers/auditController'
import { requireRole, verifyJWT } from '../middleware/auth'

export const auditRouter = Router()

auditRouter.use(verifyJWT)
auditRouter.use(requireRole(['admin']))
auditRouter.get('/', listAuditLogsHandler)
