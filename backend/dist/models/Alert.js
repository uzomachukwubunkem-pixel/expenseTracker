import { Schema, model } from 'mongoose';
const alertSchema = new Schema({
    company: { type: Schema.Types.ObjectId, ref: 'CompanySettings', required: true },
    type: {
        type: String,
        enum: ['VAT_THRESHOLD', 'CIT_THRESHOLD', 'FILING_DEADLINE'],
        required: true,
    },
    message: { type: String, required: true },
    level: { type: String, enum: ['info', 'warning', 'critical'], default: 'warning' },
    read: { type: Boolean, default: false },
}, { timestamps: true });
alertSchema.index({ company: 1, createdAt: -1 });
export const AlertModel = model('Alert', alertSchema);
