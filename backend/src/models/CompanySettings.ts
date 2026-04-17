import { Schema, model, type Document } from 'mongoose'

export interface CompanySettingsDocument extends Document {
  legalName: string
  taxId: string
  yearlyTurnover: number
  invoiceSequence: number
}

const companySettingsSchema = new Schema<CompanySettingsDocument>(
  {
    legalName: { type: String, required: true },
    taxId: { type: String, required: true, unique: true },
    yearlyTurnover: { type: Number, default: 0 },
    invoiceSequence: { type: Number, default: 1 },
  },
  { timestamps: true },
)

export const CompanySettingsModel = model<CompanySettingsDocument>('CompanySettings', companySettingsSchema)
