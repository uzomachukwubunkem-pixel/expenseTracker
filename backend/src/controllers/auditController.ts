import type { Request, Response } from 'express'
import { AuditLogModel } from '../models/AuditLog'
import { asyncHandler } from '../middleware/asyncHandler'

const parseString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const parseDate = (value: unknown): Date | undefined => {
  const parsed = parseString(value)
  if (!parsed) return undefined
  const date = new Date(parsed)
  return Number.isNaN(date.getTime()) ? undefined : date
}

const parsePositiveInt = (value: unknown, fallback: number, max: number): number => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  const normalized = Math.floor(parsed)
  if (normalized < 1) return fallback
  return Math.min(normalized, max)
}

export const listAuditLogsHandler = asyncHandler(async (req: Request, res: Response) => {
  const page = parsePositiveInt(req.query.page, 1, 1000)
  const limit = parsePositiveInt(req.query.limit, 25, 100)
  const action = parseString(req.query.action)
  const entityType = parseString(req.query.entityType)
  const start = parseDate(req.query.start)
  const end = parseDate(req.query.end)

  const filters: Record<string, unknown> = {}

  if (action) filters.action = action.toUpperCase()
  if (entityType) filters.entityType = entityType
  if (start || end) {
    filters.timestamp = {
      ...(start ? { $gte: start } : {}),
      ...(end ? { $lte: end } : {}),
    }
  }

  const [items, total] = await Promise.all([
    AuditLogModel.find(filters)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AuditLogModel.countDocuments(filters),
  ])

  res.json({ success: true, data: { items, total, page, limit } })
})
