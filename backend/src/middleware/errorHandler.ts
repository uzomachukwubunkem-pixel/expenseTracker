import type { NextFunction, Request, Response } from 'express'
import mongoose from 'mongoose'
import { ZodError } from 'zod'
import { AppError } from '../utils/appError'
import { logger } from '../utils/logger'

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message })
    return
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0]
    res.status(400).json({
      success: false,
      message: firstIssue
        ? `${firstIssue.path.join('.') || 'payload'}: ${firstIssue.message}`
        : 'Validation failed',
      errors: err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    })
    return
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((fieldError) => ({
        path: fieldError.path,
        message: fieldError.message,
      })),
    })
    return
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid value for ${err.path}`,
    })
    return
  }

  const mongoServerError = err as { code?: number; keyPattern?: Record<string, number> }
  if (mongoServerError.code === 11000) {
    const duplicateField = Object.keys(mongoServerError.keyPattern ?? {})[0] ?? 'field'
    res.status(409).json({
      success: false,
      message: `${duplicateField} already exists`,
    })
    return
  }

  logger.error({ message: err.message, stack: err.stack })

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  })
}
