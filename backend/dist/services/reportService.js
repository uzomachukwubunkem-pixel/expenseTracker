import { ExpenseModel } from '../models/Expense';
import { CompanySettingsModel } from '../models/CompanySettings';
import { AppError } from '../utils/appError';
import { calculatePresumptiveTaxForTurnover, estimateCITForProfit, isCITExemptForTurnover, isVATExemptForTurnover, } from './taxService';
export const getTaxSummary = async (period) => {
    const [expenses, company] = await Promise.all([
        ExpenseModel.find({ date: { $gte: period.start, $lte: period.end } }).lean(),
        CompanySettingsModel.findOne().lean(),
    ]);
    const turnover = company?.yearlyTurnover ?? 0;
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const estimatedProfit = Math.max(turnover - totalExpenses, 0);
    return {
        turnover,
        totalExpenses,
        estimatedProfit,
        vatExempt: isVATExemptForTurnover(turnover),
        citExempt: isCITExemptForTurnover(turnover),
        presumptiveTax: calculatePresumptiveTaxForTurnover(turnover),
        estimatedCIT: estimateCITForProfit(estimatedProfit, turnover),
    };
};
export const getCompanySettings = async () => {
    const settings = await CompanySettingsModel.findOne().lean();
    if (!settings) {
        return {
            legalName: '',
            taxId: '',
            yearlyTurnover: 0,
        };
    }
    return {
        legalName: settings.legalName,
        taxId: settings.taxId,
        yearlyTurnover: settings.yearlyTurnover,
    };
};
export const upsertCompanySettings = async (payload) => {
    const legalName = String(payload.legalName ?? '').trim();
    const taxId = String(payload.taxId ?? '').trim();
    const yearlyTurnover = Number(payload.yearlyTurnover ?? 0);
    if (!legalName)
        throw new AppError('Legal name is required', 400);
    if (!taxId)
        throw new AppError('Tax ID is required', 400);
    if (!Number.isFinite(yearlyTurnover) || yearlyTurnover < 0) {
        throw new AppError('Yearly turnover must be a valid non-negative number', 400);
    }
    const existing = await CompanySettingsModel.findOne();
    if (!existing) {
        const created = await CompanySettingsModel.create({
            legalName,
            taxId,
            yearlyTurnover,
            invoiceSequence: 1,
        });
        return {
            legalName: created.legalName,
            taxId: created.taxId,
            yearlyTurnover: created.yearlyTurnover,
        };
    }
    existing.legalName = legalName;
    existing.taxId = taxId;
    existing.yearlyTurnover = yearlyTurnover;
    await existing.save();
    return {
        legalName: existing.legalName,
        taxId: existing.taxId,
        yearlyTurnover: existing.yearlyTurnover,
    };
};
