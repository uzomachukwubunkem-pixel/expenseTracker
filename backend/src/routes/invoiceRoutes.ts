import { Router } from 'express'
import { createInvoiceHandler } from '../controllers/invoiceController'
import { verifyJWT } from '../middleware/auth'

export const invoiceRouter = Router()

invoiceRouter.use(verifyJWT)
invoiceRouter.post('/', createInvoiceHandler)
