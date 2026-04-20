import { TAX_CONFIG } from '@expense-tracker/shared'
import { useMemo, useState } from 'react'
import { ExpenseForm } from '../expenses/ExpenseForm'
import { ExpenseList } from '../expenses/ExpenseList'
import {
  useCompanySettingsQuery,
  useTaxSummaryQuery,
  useUpsertCompanySettingsMutation,
} from '../reports/reportApi'
import { formatNaira } from '../../utils/formatHelpers'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAppSelector } from '../../hooks/redux'

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== 'object' || error === null) return fallback

  const maybeWithData = error as { data?: { message?: unknown } }
  const message = maybeWithData.data?.message
  return typeof message === 'string' ? message : fallback
}

type DraftCompanySettings = {
  legalName: string
  taxId: string
  yearlyTurnover: string
}

export function DashboardPage() {
  const authUser = useAppSelector((state) => state.auth.user)

  const { start, end, currentMonthLabel } = useMemo(() => {
    const now = new Date()
    return {
      start: new Date(now.getFullYear(), 0, 1).toISOString(),
      end: now.toISOString(),
      currentMonthLabel: now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    }
  }, [])

  const { data, isLoading } = useTaxSummaryQuery({ start, end })
  const { data: companyData } = useCompanySettingsQuery()
  const [upsertCompanySettings, { isLoading: isSavingSettings }] = useUpsertCompanySettingsMutation()
  const [settingsError, setSettingsError] = useState('')
  const [settingsInfo, setSettingsInfo] = useState('')
  const [draftSettings, setDraftSettings] = useState<DraftCompanySettings | null>(null)

  const legalName = draftSettings?.legalName ?? (companyData?.data.legalName ?? '')
  const taxId = draftSettings?.taxId ?? (companyData?.data.taxId ?? '')
  const yearlyTurnover = draftSettings?.yearlyTurnover ?? String(companyData?.data.yearlyTurnover ?? 0)

  const needsOnboarding = !companyData?.data.legalName || Number(companyData?.data.yearlyTurnover ?? 0) === 0

  const saveCompanySettings = async (event: React.FormEvent) => {
    event.preventDefault()
    setSettingsError('')
    setSettingsInfo('')

    try {
      await upsertCompanySettings({
        legalName,
        taxId,
        yearlyTurnover: Number(yearlyTurnover),
      }).unwrap()
      setSettingsInfo('Company settings saved successfully.')
      setDraftSettings(null)
    } catch (err: unknown) {
      setSettingsError(getErrorMessage(err, 'Could not save company settings'))
    }
  }

  const turnover = Number(data?.data.turnover ?? 0)
  const turnoverPct = Math.min(Math.round((turnover / TAX_CONFIG.VAT_THRESHOLD) * 100), 100)
  const totalExpenses = Number(data?.data.totalExpenses ?? 0)
  const estimatedProfit = Number(data?.data.estimatedProfit ?? 0)
  const vatStatusText = turnover >= TAX_CONFIG.VAT_THRESHOLD ? 'VAT registration required' : 'Within small-company threshold'

  return (
    <div className="page-shell">
      <header className="topbar" role="banner">
        <div>
          <p className="eyebrow">{currentMonthLabel}</p>
          <h1>Nigerian Expense Tracker</h1>
          <p className="subhead">
            Track expenses, monitor thresholds, and keep tax returns audit-ready.
          </p>
        </div>
        <div className="topbar-actions">
          <p className="user-chip">{authUser?.name ?? 'User'} • {authUser?.role ?? 'staff'}</p>
        </div>
      </header>

      <section className="kpi-grid" aria-label="Key metrics overview">
        <article className="kpi-card">
          <p className="muted">Annual Turnover</p>
          <h3>{formatNaira(turnover)}</h3>
        </article>
        <article className="kpi-card">
          <p className="muted">Total Expenses (YTD)</p>
          <h3>{formatNaira(totalExpenses)}</h3>
        </article>
        <article className="kpi-card">
          <p className="muted">Estimated Profit</p>
          <h3>{formatNaira(estimatedProfit)}</h3>
        </article>
        <article className="kpi-card">
          <p className="muted">VAT Position</p>
          <h3>{vatStatusText}</h3>
        </article>
      </section>

      <main className="content-grid" role="main">
        <aside className="sidebar" aria-label="Tax alerts and filing status">
          <article className="card warning-card">
            <h2>Turnover Alert</h2>
            <p>
              {isLoading
                ? 'Calculating turnover progress...'
                : `You are at ${turnoverPct}% of the VAT threshold (N50,000,000).`}
            </p>
            <div className="meter" aria-label="Turnover progress to VAT threshold">
              <div className="meter-fill" style={{ width: `${turnoverPct}%` }} />
            </div>
            <p className="muted">
              Current turnover: {formatNaira(turnover)}
              {!isLoading && turnover === 0 ? ' - add company turnover data to see real progress.' : ''}
            </p>
          </article>

          {needsOnboarding ? (
            <article className="card">
              <h2>Company Setup</h2>
              <p className="muted">Add your business details so turnover alerts and tax summary use real data.</p>
              <form className="form-grid" onSubmit={saveCompanySettings}>
                <label>
                  Legal business name
                  <Input
                    type="text"
                    value={legalName}
                    onChange={(event) =>
                      setDraftSettings((current) => ({
                        legalName: event.target.value,
                        taxId: current?.taxId ?? taxId,
                        yearlyTurnover: current?.yearlyTurnover ?? yearlyTurnover,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Tax ID (TIN)
                  <Input
                    type="text"
                    value={taxId}
                    onChange={(event) =>
                      setDraftSettings((current) => ({
                        legalName: current?.legalName ?? legalName,
                        taxId: event.target.value,
                        yearlyTurnover: current?.yearlyTurnover ?? yearlyTurnover,
                      }))
                    }
                    required
                  />
                </label>
                <label>
                  Yearly turnover
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={yearlyTurnover}
                    onChange={(event) =>
                      setDraftSettings((current) => ({
                        legalName: current?.legalName ?? legalName,
                        taxId: current?.taxId ?? taxId,
                        yearlyTurnover: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                {settingsError ? <p className="error-text">{settingsError}</p> : null}
                {settingsInfo ? <p className="info-text">{settingsInfo}</p> : null}
                <Button type="submit" disabled={isSavingSettings}>
                  {isSavingSettings ? 'Saving...' : 'Save company settings'}
                </Button>
              </form>
            </article>
          ) : null}

          <article className="card">
            <h2>Tax Summary</h2>
            <dl>
              <div>
                <dt>Input VAT (YTD)</dt>
                <dd>{formatNaira(Number(data?.data.totalExpenses ?? 0) * TAX_CONFIG.VAT_RATE)}</dd>
              </div>
              <div>
                <dt>CIT Status</dt>
                <dd>{data?.data.citExempt ? 'Exempt (small company)' : 'Taxable'}</dd>
              </div>
              <div>
                <dt>Presumptive Tax</dt>
                <dd>{formatNaira(Number(data?.data.presumptiveTax ?? 0))}</dd>
              </div>
            </dl>
          </article>

          <ExpenseForm />
        </aside>

        <ExpenseList />
      </main>
    </div>
  )
}
