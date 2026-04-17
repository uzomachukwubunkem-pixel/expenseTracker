import mongoose from 'mongoose'
import { AuditLogModel } from '../models/AuditLog'
import { UserModel } from '../models/User'
import { AppError } from '../utils/appError'

type Role = 'admin' | 'staff'
type StatusFilter = 'active' | 'inactive'

interface ListUsersParams {
  companyId: string
  page?: number
  limit?: number
  role?: Role
  status?: StatusFilter
  q?: string
}

interface UpdateRoleParams {
  currentUserId: string
  currentCompanyId: string
  userId: string
  role: Role
}

interface UpdateStatusParams {
  currentUserId: string
  currentCompanyId: string
  userId: string
  isActive: boolean
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const assertObjectId = (value: string, label: string): void => {
  if (!mongoose.isValidObjectId(value)) {
    throw new AppError(`Invalid ${label}`, 400)
  }
}

const ensureCanChangeAdminState = async (
  userId: string,
  companyId: string,
  nextRole?: Role,
  nextActive?: boolean,
) => {
  const target = await UserModel.findById(userId).lean()
  if (!target) throw new AppError('User not found', 404)
  if (target.companyId !== companyId) throw new AppError('Forbidden', 403)

  const currentlyAdmin = target.role === 'admin'
  const willRemainAdmin = nextRole ? nextRole === 'admin' : currentlyAdmin
  const willBeActive = nextActive === undefined ? target.isActive !== false : nextActive

  if (!currentlyAdmin) return
  if (willRemainAdmin && willBeActive) return

  const activeAdmins = await UserModel.countDocuments({ role: 'admin', isActive: true, companyId })
  if (activeAdmins <= 1) {
    throw new AppError('At least one active admin is required for this company', 400)
  }
}

const writeUserAuditLog = async (params: {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  documentId: mongoose.Types.ObjectId
  userId: string
  changes: Record<string, unknown>
}) => {
  await AuditLogModel.create({
    action: params.action,
    entityType: 'users',
    documentId: params.documentId,
    userId: new mongoose.Types.ObjectId(params.userId),
    changes: params.changes,
    timestamp: new Date(),
  })
}

export const listUsers = async (params: ListUsersParams) => {
  const page = clamp(Number(params.page ?? 1), 1, 100000)
  const limit = clamp(Number(params.limit ?? 25), 1, 100)

  const filter: Record<string, unknown> = {}
  filter.companyId = params.companyId

  if (params.role === 'admin' || params.role === 'staff') {
    filter.role = params.role
  }

  if (params.status === 'active') {
    filter.isActive = true
  }

  if (params.status === 'inactive') {
    filter.isActive = false
  }

  const q = params.q?.trim()
  if (q) {
    const regex = new RegExp(escapeRegex(q), 'i')
    filter.$or = [{ name: regex }, { email: regex }]
  }

  const [items, total] = await Promise.all([
    UserModel.find(filter)
      .select('name email role isEmailVerified isActive createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    UserModel.countDocuments(filter),
  ])

  return {
    items: items.map((item) => ({
      id: String(item._id),
      name: item.name,
      email: item.email,
      role: item.role,
      isEmailVerified: item.isEmailVerified,
      isActive: item.isActive ?? true,
      createdAt: item.createdAt,
    })),
    total,
    page,
    limit,
  }
}

export const updateUserRole = async ({ currentUserId, currentCompanyId, userId, role }: UpdateRoleParams) => {
  assertObjectId(userId, 'user id')

  const user = await UserModel.findById(userId)
  if (!user) throw new AppError('User not found', 404)
  if (user.companyId !== currentCompanyId) {
    throw new AppError('Forbidden', 403)
  }

  const previousRole = user.role

  if (currentUserId === userId && role !== 'admin') {
    throw new AppError('You cannot remove your own admin role', 400)
  }

  await ensureCanChangeAdminState(userId, currentCompanyId, role)

  user.role = role
  await user.save()

  await writeUserAuditLog({
    action: 'UPDATE',
    documentId: user._id,
    userId: currentUserId,
    changes: {
      field: 'role',
      before: previousRole,
      after: role,
      targetUser: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
    },
  })

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
  }
}

export const updateUserStatus = async ({ currentUserId, currentCompanyId, userId, isActive }: UpdateStatusParams) => {
  assertObjectId(userId, 'user id')

  if (currentUserId === userId && !isActive) {
    throw new AppError('You cannot deactivate your own account', 400)
  }

  await ensureCanChangeAdminState(userId, currentCompanyId, undefined, isActive)

  const previous = await UserModel.findById(userId).lean()
  if (!previous) throw new AppError('User not found', 404)
  if (previous.companyId !== currentCompanyId) {
    throw new AppError('Forbidden', 403)
  }

  const user = await UserModel.findByIdAndUpdate(userId, { isActive }, { new: true })
  if (!user) throw new AppError('User not found', 404)

  await writeUserAuditLog({
    action: 'UPDATE',
    documentId: user._id,
    userId: currentUserId,
    changes: {
      field: 'isActive',
      before: previous.isActive,
      after: isActive,
      targetUser: {
        id: String(user._id),
        name: user.name,
        email: user.email,
      },
    },
  })

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isActive: user.isActive,
    createdAt: user.createdAt,
  }
}
