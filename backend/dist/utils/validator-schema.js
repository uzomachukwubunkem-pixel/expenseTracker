import { z } from 'zod';
export const registerSchema = z
    .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    role: z.enum(['admin', 'staff']).optional(),
    companyId: z.string().max(100).optional(),
})
    .strict()
    .superRefine((data, ctx) => {
    if (data.role === 'staff' && !data.companyId?.trim()) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['companyId'],
            message: 'Company ID is required for staff accounts',
        });
    }
});
export const loginSchema = z
    .object({
    email: z.string().email(),
    password: z.string().min(8).max(100),
})
    .strict();
export const sendVerificationCodeSchema = z
    .object({
    email: z.string().email(),
})
    .strict();
export const requestPasswordResetSchema = z
    .object({
    email: z.string().email(),
})
    .strict();
export const resetPasswordSchema = z
    .object({
    email: z.string().email(),
    token: z.string().min(10),
    password: z.string().min(8).max(100),
})
    .strict();
export const verifyEmailCodeSchema = z
    .object({
    email: z.string().email(),
    code: z.string().length(6),
})
    .strict();
export const expenseSchema = z
    .object({
    amount: z.number().positive(),
    description: z.string().min(2).max(500),
    category: z.string().min(2).max(80),
    date: z.coerce.date(),
    amountExcludingVAT: z.number().nonnegative().optional(),
})
    .strict();
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
    .strict();
export const invoiceSchema = z
    .object({
    buyerName: z.string().min(2).max(120),
    buyerTaxId: z.string().min(5).max(40),
    sellerName: z.string().min(2).max(120),
    sellerTaxId: z.string().min(5).max(40),
    total: z.number().positive(),
    issuedAt: z.coerce.date(),
})
    .strict();
