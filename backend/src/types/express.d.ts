import type { Role } from '../types/tax'

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
