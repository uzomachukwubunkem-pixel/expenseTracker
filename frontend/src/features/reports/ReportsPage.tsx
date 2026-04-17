import { useMemo } from 'react'
import { useAppSelector } from '../../hooks/redux'
import { useCitReturnQuery, useCompanySettingsQuery, useTaxSummaryQuery, useVatReturnQuery } from './reportApi'
import { useAlertsQuery } from './reportApi'
import { formatNaira } from '../../utils/formatHelpers'

const asNumber = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : 0

const asText = (value: unknown, fallback = '-'): string =>
  typeof value === 'string' && value.trim() ? value : fallback

const money = (value: unknown): string =>
  formatNaira(asNumber(value))

export function ReportsPage() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1).toISOString()
  const end = now.toISOString()
  const currentYear = now.getFullYear()
  const authUser = useAppSelector((state) => state.auth.user)
  const isAdmin = authUser?.role === 'admin'

  const { data: taxSummary, isLoading: loadingSummary } = useTaxSummaryQuery({ start, end })
  const { data: alerts } = useAlertsQuery()
  const { data: companySettings } = useCompanySettingsQuery()
  const { data: vatReturn } = useVatReturnQuery(
    { start, end, format: 'json' },
    { skip: !isAdmin },
  )
  const { data: citReturn } = useCitReturnQuery({ year: currentYear }, { skip: !isAdmin })

  const metrics = useMemo(
    () => [
      { label: 'Turnover', value: money(taxSummary?.data.turnover ?? 0) },
      { label: 'Estimated Profit', value: money(taxSummary?.data.estimatedProfit ?? 0) },
      { label: 'Taxable?', value: taxSummary?.data.citExempt ? 'No' : 'Yes' },
    ],
    [taxSummary],
  )

  return (
    <main className="page-shell">
      <section className="page-flex">
        <section className="card full-width">
          <p className="eyebrow">Reports</p>
          <h1>Tax and compliance reports</h1>
          <p className="subhead">Review turnover, VAT, CIT, company settings, and alerts in one place.</p>
        </section>

        <section className="kpi-grid full-width" aria-label="report metrics">
          {metrics.map((metric) => (
            <article key={metric.label} className="kpi-card">
              <p className="muted">{metric.label}</p>
              <h3>{String(metric.value)}</h3>
            </article>
          ))}
        </section>

        <section className="card">
          <h2>Company settings</h2>
          <p>{companySettings?.data.legalName || 'No company settings saved yet.'}</p>
          <p className="muted">TIN: {companySettings?.data.taxId || '-'}</p>
          <p className="muted">Yearly turnover: {money(companySettings?.data.yearlyTurnover ?? 0)}</p>
        </section>

        <section className="card">
          <h2>VAT return</h2>
          {isAdmin ? (
            <div className="form-grid">
              <p className="muted">VAT rate: {(asNumber(vatReturn?.data?.vatRate) * 100).toFixed(1)}%</p>
              <p className="muted">Total input VAT: {money(vatReturn?.data?.totalInputVAT)}</p>
              <p className="muted">Expenses included: {Array.isArray(vatReturn?.data?.expenses) ? vatReturn?.data?.expenses.length : 0}</p>
            </div>
          ) : (
            <p className="muted">Admin only</p>
          )}
        </section>

        <section className="card">
          <h2>CIT return</h2>
          {isAdmin ? (
            <div className="form-grid">
              <p className="muted">Turnover: {money(citReturn?.data?.turnover)}</p>
              <p className="muted">Total expenses: {money(citReturn?.data?.totalExpenses)}</p>
              <p className="muted">Estimated profit: {money(citReturn?.data?.estimatedProfit)}</p>
              <p className="muted">Estimated CIT: {money(citReturn?.data?.estimatedCIT)}</p>
              <p className="muted">Status: {citReturn?.data?.exempt ? 'Exempt' : 'Taxable'}</p>
              <p className="muted">Reason: {asText(citReturn?.data?.reason, 'No reason provided')}</p>
            </div>
          ) : (
            <p className="muted">Admin only</p>
          )}
        </section>

        <section className="card">
          <h2>Alerts</h2>
          {Array.isArray(alerts?.data) && alerts.data.length > 0 ? (
            <div className="form-grid">
              {alerts.data.slice(0, 10).map((alert, index) => (
                <article key={`${index}-${asText(alert.message, 'alert')}`} className="kpi-card">
                  <p><strong>{asText(alert.type, 'ALERT')}</strong></p>
                  <p className="muted">{asText(alert.message, 'No message provided')}</p>
                </article>
              ))}
            </div>
          ) : (
            <p className="muted">No alerts yet.</p>
          )}
        </section>
      </section>

      {loadingSummary ? <p className="muted">Loading summary...</p> : null}
    </main>
  )
}