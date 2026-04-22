import { TAX_CONFIG, } from '../config/constants';
import { calculatePresumptiveTax, estimateCIT, isCITExempt, isVATExempt, computeInputVAT } from "../utils/tax";
import { CompanySettingsModel } from '../models/CompanySettings.js';
import { ExpenseModel } from '../models/Expense.js';
export const computeInputVATForExpense = (amountExcludingVAT) => computeInputVAT(amountExcludingVAT);
export const isCITExemptForTurnover = (annualTurnover) => isCITExempt(annualTurnover);
export const isVATExemptForTurnover = (annualTurnover) => isVATExempt(annualTurnover);
export const calculatePresumptiveTaxForTurnover = (turnover) => calculatePresumptiveTax(turnover);
export const estimateCITForProfit = (profit, turnover) => estimateCIT(profit, turnover);
export const generateVATReturn = async (period) => {
    const expenses = await ExpenseModel.find({
        date: { $gte: period.start, $lte: period.end },
    }).lean();
    const totalInputVAT = expenses.reduce((sum, exp) => sum + (exp.inputVAT ?? 0), 0);
    return {
        period,
        vatRate: TAX_CONFIG.VAT_RATE,
        totalInputVAT: Number(totalInputVAT.toFixed(2)),
        expenses,
    };
};
export const generateCITReturn = async (period) => {
    const [expenses, company] = await Promise.all([
        ExpenseModel.find({
            date: { $gte: period.start, $lte: period.end },
        }).lean(),
        CompanySettingsModel.findOne().lean(),
    ]);
    const turnover = company?.yearlyTurnover ?? 0;
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const estimatedProfit = Math.max(turnover - totalExpenses, 0);
    const exempt = isCITExempt(turnover);
    return {
        period,
        turnover,
        totalExpenses: Number(totalExpenses.toFixed(2)),
        estimatedProfit: Number(estimatedProfit.toFixed(2)),
        exempt,
        rate: TAX_CONFIG.CIT_RATE,
        estimatedCIT: exempt ? 0 : estimateCIT(estimatedProfit, turnover),
        reason: exempt
            ? 'Turnover is within small-company CIT exemption threshold'
            : 'Turnover exceeds small-company CIT exemption threshold',
    };
};
