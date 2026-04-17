import { z } from 'zod'

export const registerSchema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    role: z.enum(['admin', 'staff']).optional(),
    companyId: z.string().max(100).optional(),
  })
  .strict()

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
  })
  .strict()

export const sendVerificationCodeSchema = z
  .object({
    email: z.string().email(),
  })
  .strict()

export const requestPasswordResetSchema = z
  .object({
    email: z.string().email(),
  })
  .strict()

export const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    token: z.string().min(10),
    password: z.string().min(8).max(100),
  })
  .strict()

export const verifyEmailCodeSchema = z
  .object({
    email: z.string().email(),
    code: z.string().length(6),
  })
  .strict()
