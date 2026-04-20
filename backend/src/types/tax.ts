export type Role = 'admin' | 'staff'

export interface Period {
  start: Date
  end: Date
}

export interface TaxCalculationResult {
  inputVAT: number
  isCITExempt: boolean
  isVATExempt: boolean
  isWHTExempt: boolean
  presumptiveTax: number
  estimatedCIT: number
}