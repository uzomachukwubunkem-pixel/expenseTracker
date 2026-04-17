import { TAX_CONFIG } from '@expense-tracker/shared'
import { AlertModel } from '../models/Alert'
import { CompanySettingsModel } from '../models/CompanySettings'

export const createTurnoverAlerts = async (): Promise<void> => {
  const companies = await CompanySettingsModel.find().lean()

  for (const company of companies) {
    const turnover = company.yearlyTurnover ?? 0

    const checks = [
      {
        type: 'VAT_THRESHOLD' as const,
        threshold: TAX_CONFIG.VAT_THRESHOLD,
        message: 'You are approaching the VAT threshold (N50,000,000).',
      },
      {
        type: 'CIT_THRESHOLD' as const,
        threshold: TAX_CONFIG.CIT_THRESHOLD,
        message: 'You are approaching the CIT threshold (N100,000,000).',
      },
    ]

    for (const check of checks) {
      if (turnover >= check.threshold * 0.9) {
        await AlertModel.create({
          company: company._id,
          type: check.type,
          message: check.message,
          level: 'warning',
        })
      }
    }
  }
}

export const listAlerts = async () => AlertModel.find().sort({ createdAt: -1 }).lean()
