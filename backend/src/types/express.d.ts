import type { Role } from '@expense-tracker/shared'

declare global {
  namespace Express {
    interface UserPayload {
      userId: string
      role: Role
      email: string
      companyId: string
    }

    interface Request {
      user?: UserPayload
    }
  }
}

export {}
