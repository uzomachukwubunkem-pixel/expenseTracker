import { Schema, model, type Document, Types } from 'mongoose'

export interface InvoiceDocument extends Document {
  company: Types.ObjectId
  user: Types.ObjectId
  invoiceNumber: string
  buyerName: string
  buyerTaxId: string
  sellerName: string
  sellerTaxId: string
  total: number
  status: 'draft' | 'issued' | 'paid' | 'void'
  issuedAt: Date
}

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    company: { type: Schema.Types.ObjectId, ref: 'CompanySettings', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    buyerName: { type: String, required: true },
    buyerTaxId: { type: String, required: true },
    sellerName: { type: String, required: true },
    sellerTaxId: { type: String, required: true },
    total: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'void'],
      default: 'issued',
      index: true,
    },
    issuedAt: { type: Date, required: true, index: true },
  },
  { timestamps: true },
)

invoiceSchema.index({ company: 1, status: 1, issuedAt: -1 })

export const InvoiceModel = model<InvoiceDocument>('Invoice', invoiceSchema)
