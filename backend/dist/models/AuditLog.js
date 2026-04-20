import { Schema, model } from 'mongoose';
const auditLogSchema = new Schema({
    action: { type: String, enum: ['CREATE', 'UPDATE', 'DELETE'], required: true },
    entityType: { type: String, required: true },
    documentId: { type: Schema.Types.ObjectId, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    changes: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now },
}, { versionKey: false });
auditLogSchema.index({ entityType: 1, documentId: 1, timestamp: -1 });
export const AuditLogModel = model('AuditLog', auditLogSchema);
