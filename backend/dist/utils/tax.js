import { TAX_CONFIG } from '../config/constants';
export const computeInputVAT = (amountExcludingVAT) => Number((amountExcludingVAT * TAX_CONFIG.VAT_RATE).toFixed(2));
export const isCITExempt = (annualTurnover) => annualTurnover <= TAX_CONFIG.CIT_THRESHOLD;
export const isVATExempt = (annualTurnover) => annualTurnover < TAX_CONFIG.VAT_THRESHOLD;
export const isWHTExempt = (annualTurnover) => annualTurnover <= TAX_CONFIG.WHT_THRESHOLD;
export const calculatePresumptiveTax = (turnover) => {
    if (turnover > TAX_CONFIG.PRESUMPTIVE_THRESHOLD)
        return 0;
    return Number((turnover * TAX_CONFIG.PRESUMPTIVE_RATE).toFixed(2));
};
export const estimateCIT = (profit, turnover) => {
    if (isCITExempt(turnover) || profit <= 0)
        return 0;
    return Number((profit * TAX_CONFIG.CIT_RATE).toFixed(2));
};
export const calculateCGT = (capitalGain) => {
    if (capitalGain <= 0)
        return 0;
    return Number((capitalGain * TAX_CONFIG.CGT_RATE).toFixed(2));
};
