import { invoiceSchema } from '@expense-tracker/shared';
import { CompanySettingsModel } from '../models/CompanySettings';
import { InvoiceModel } from '../models/Invoice';
import { AppError } from '../utils/appError';
const makeInvoiceNumber = (sequence) => `INV-${String(sequence).padStart(6, '0')}`;
export const createInvoice = async (userId, payload) => {
    const parsed = invoiceSchema.parse(payload);
    const company = await CompanySettingsModel.findOne();
    if (!company)
        throw new AppError('Company settings not initialized', 400);
    const invoiceNumber = makeInvoiceNumber(company.invoiceSequence);
    const invoice = await InvoiceModel.create({
        company: company._id,
        user: userId,
        invoiceNumber,
        buyerName: parsed.buyerName,
        buyerTaxId: parsed.buyerTaxId,
        sellerName: parsed.sellerName,
        sellerTaxId: parsed.sellerTaxId,
        total: parsed.total,
        issuedAt: parsed.issuedAt,
        status: 'issued',
    });
    company.invoiceSequence += 1;
    company.yearlyTurnover += parsed.total;
    await company.save();
    return invoice;
};
