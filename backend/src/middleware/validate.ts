import { ZodError, type ZodTypeAny } from 'zod'
import type { NextFunction, Request, Response } from 'express'

export const validate = (schema: ZodTypeAny, source: 'body' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source])
      req[source] = parsed
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.issues,
        })
        return
      }
      next(error)
    }
  }
}
