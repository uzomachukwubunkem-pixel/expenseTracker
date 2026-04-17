import { z } from 'zod'

export const invoiceSchema = z
  .object({
    buyerName: z.string().min(2).max(120),
    buyerTaxId: z.string().min(5).max(40),
    sellerName: z.string().min(2).max(120),
    sellerTaxId: z.string().min(5).max(40),
    total: z.number().positive(),
    issuedAt: z.coerce.date(),
  })
  .strict()
