import { computeInputVATForExpense, estimateCITForProfit, isCITExemptForTurnover } from '../../src/services/taxService'

describe('taxService', () => {
  it('computes input VAT correctly', () => {
    expect(computeInputVATForExpense(100000)).toBe(7500)
  })

  it('marks small companies as CIT exempt', () => {
    expect(isCITExemptForTurnover(100_000_000)).toBe(true)
    expect(isCITExemptForTurnover(100_000_001)).toBe(false)
  })

  it('estimates CIT only when not exempt', () => {
    expect(estimateCITForProfit(2_000_000, 90_000_000)).toBe(0)
    expect(estimateCITForProfit(2_000_000, 120_000_000)).toBe(600000)
  })
})
