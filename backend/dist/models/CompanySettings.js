import { Schema, model } from 'mongoose';
const companySettingsSchema = new Schema({
    legalName: { type: String, required: true },
    taxId: { type: String, required: true, unique: true },
    yearlyTurnover: { type: Number, default: 0 },
    invoiceSequence: { type: Number, default: 1 },
}, { timestamps: true });
export const CompanySettingsModel = model('CompanySettings', companySettingsSchema);
