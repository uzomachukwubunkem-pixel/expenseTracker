import { Schema, model, type Document, Types } from 'mongoose'

interface AlertDocument extends Document {
  company: Types.ObjectId
  type: 'VAT_THRESHOLD' | 'CIT_THRESHOLD' | 'FILING_DEADLINE'
  message: string
  level: 'info' | 'warning' | 'critical'
  read: boolean
}

const alertSchema = new Schema<AlertDocument>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'CompanySettings', required: true },
    type: {
      type: String,
      enum: ['VAT_THRESHOLD', 'CIT_THRESHOLD', 'FILING_DEADLINE'],
      required: true,
    },
    message: { type: String, required: true },
    level: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
)

alertSchema.index({ company: 1, createdAt: -1 })

export const AlertModel = model<AlertDocument>('Alert', alertSchema)
