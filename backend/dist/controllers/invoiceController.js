import { asyncHandler } from '../middleware/asyncHandler';
import { createInvoice } from '../services/invoiceService';
export const createInvoiceHandler = asyncHandler(async (req, res) => {
    const invoice = await createInvoice(req.user.userId, req.body);
    res.status(201).json({ success: true, data: invoice });
});
