import { Router } from 'express'
import {
	alertsHandler,
	citReturnHandler,
	getCompanySettingsHandler,
	taxSummaryHandler,
	upsertCompanySettingsHandler,
	vatReturnHandler,
} from '../controllers/reportController'
import { requireRole, verifyJWT } from '../middleware/auth'

export const reportRouter = Router()

reportRouter.use(verifyJWT)
reportRouter.get('/tax-summary', requireRole(['admin', 'staff']), taxSummaryHandler)
reportRouter.get('/vat-return', requireRole(['admin']), vatReturnHandler)
reportRouter.get('/cit-return', requireRole(['admin']), citReturnHandler)
reportRouter.get('/alerts', requireRole(['admin']), alertsHandler)
reportRouter.get('/company-settings', requireRole(['admin', 'staff']), getCompanySettingsHandler)
reportRouter.put('/company-settings', requireRole(['admin']), upsertCompanySettingsHandler)
