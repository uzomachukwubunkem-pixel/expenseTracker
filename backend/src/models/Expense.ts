import { Schema, model, type Document, Types } from 'mongoose'
import { computeInputVAT } from '@expense-tracker/shared'
import { AuditLogModel } from './AuditLog'

interface ExpenseDocument extends Document {
  user: Types.ObjectId
  amount: number
  amountExcludingVAT: number
  inputVAT: number
  description: string
  category: string
  date: Date
  deletedAt?: Date | null
  _previousDoc?: Record<string, unknown> | null
}

const expenseSchema = new Schema<ExpenseDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    amountExcludingVAT: { type: Number, required: true, min: 0 },
    inputVAT: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
)

expenseSchema.index({ user: 1, date: -1 })
expenseSchema.index({ user: 1, category: 1 })
expenseSchema.index({ user: 1, deletedAt: 1 })

expenseSchema.pre('validate', function populateVat(next) {
  if (!this.amountExcludingVAT) {
    this.amountExcludingVAT = this.amount / 1.075
  }
  this.inputVAT = computeInputVAT(this.amountExcludingVAT)
  next()
})

expenseSchema.pre('findOneAndUpdate', async function capturePrevious(next) {
  const previous = await this.model.findOne(this.getQuery()).lean()
  ;(this as any)._previousDoc = previous
  next()
})

expenseSchema.post('save', async function auditCreate(doc) {
  const userId = doc.$locals?.userId
  await AuditLogModel.create({
    action: doc.deletedAt ? 'DELETE' : 'CREATE',
    entityType: 'expenses',
    documentId: doc._id,
    userId,
    changes: doc.toObject(),
    timestamp: new Date(),
  })
})

expenseSchema.post('findOneAndUpdate', async function auditUpdate(doc) {
  if (!doc) return

  const query = this as any

  await AuditLogModel.create({
    action: doc.deletedAt ? 'DELETE' : 'UPDATE',
    entityType: 'expenses',
    documentId: doc._id,
    userId: query?.options?._auditUserId,
    changes: {
      before: query?._previousDoc,
      after: doc.toObject(),
    },
    timestamp: new Date(),
  })
})

export const ExpenseModel = model<ExpenseDocument>('Expense', expenseSchema)
