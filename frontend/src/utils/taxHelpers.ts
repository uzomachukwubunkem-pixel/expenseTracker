import {
  TAX_CONFIG,
  computeInputVAT,
  estimateCIT,
  isCITExempt,
  isVATExempt,
  calculatePresumptiveTax,
} from '@expense-tracker/shared'

export const calculateVATOnExpense = computeInputVAT
export const getTaxConfig = () => TAX_CONFIG
export const computeCITEstimate = estimateCIT
export const checkCITExempt = isCITExempt
export const checkVATExempt = isVATExempt
export const computePresumptiveTax = calculatePresumptiveTax
