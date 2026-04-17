import type { NextFunction, Request, Response } from 'express'
import { verifyAccessToken } from '../utils/tokens'

export const verifyJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Unauthorized' })
    return
  }

  const token = authHeader.split(' ')[1]
  try {
    req.user = verifyAccessToken(token)
    next()
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' })
  }
}

export const requireRole =
  (roles: Array<'admin' | 'staff'>) => (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Forbidden' })
      return
    }
    next()
  }
