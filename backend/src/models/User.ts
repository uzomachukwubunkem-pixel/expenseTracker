import { Schema, model, type Document } from 'mongoose'
import bcrypt from 'bcryptjs'
import type { Role } from '@expense-tracker/shared'

export interface UserDocument extends Document {
  name: string
  email: string
  password: string
  role: Role
  companyId: string
  isActive: boolean
  isEmailVerified: boolean
  createdAt: Date
  updatedAt: Date
  emailVerificationCodeHash?: string
  emailVerificationCodeExpiresAt?: Date
  passwordResetTokenHash?: string
  passwordResetTokenExpiresAt?: Date
  refreshTokenVersion: number
  comparePassword: (candidate: string) => Promise<boolean>
}

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    companyId: { type: String, required: true, index: true, trim: true, lowercase: true },
    isActive: { type: Boolean, default: true, index: true },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationCodeHash: { type: String, select: false },
    emailVerificationCodeExpiresAt: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetTokenExpiresAt: { type: Date, select: false },
    refreshTokenVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
)

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  return next()
})

userSchema.methods.comparePassword = function comparePassword(candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password)
}

export const UserModel = model<UserDocument>('User', userSchema)
