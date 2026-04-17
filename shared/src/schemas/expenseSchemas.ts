import { z } from 'zod'

export const expenseSchema = z
  .object({
    amount: z.number().positive(),
    description: z.string().min(2).max(500),
    category: z.string().min(2).max(80),
    date: z.coerce.date(),
    amountExcludingVAT: z.number().nonnegative().optional(),
  })
  .strict()

export const expenseQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    category: z.string().min(2).max(80).optional(),
    minAmount: z.coerce.number().nonnegative().optional(),
    maxAmount: z.coerce.number().nonnegative().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .strict()
