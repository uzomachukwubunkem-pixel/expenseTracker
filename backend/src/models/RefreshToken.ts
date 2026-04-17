import { Schema, model, type Document, Types } from 'mongoose'

interface RefreshTokenDocument extends Document {
  user: Types.ObjectId
  tokenHash: string
  expiresAt: Date
  revoked: boolean
}

const refreshTokenSchema = new Schema<RefreshTokenDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true },
)

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshTokenModel = model<RefreshTokenDocument>('RefreshToken', refreshTokenSchema)
