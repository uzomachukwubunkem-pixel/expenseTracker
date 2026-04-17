import { useMemo, useState } from 'react'
import { useListAuditLogsQuery } from './auditApi'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const asText = (value: unknown, fallback = '-'): string =>
  typeof value === 'string' && value.trim() ? value : fallback

const formatAction = (value: unknown): string => {
  const action = asText(value, 'ACTION').toUpperCase()
  if (action === 'CREATE') return 'Created'
  if (action === 'UPDATE') return 'Updated'
  if (action === 'DELETE') return 'Deleted'
  return action
}

const formatTimestamp = (value: unknown): string => {
  const raw = asText(value, '')
  if (!raw) return '-'

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  return date.toLocaleString()
}

export function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)
  const [action, setAction] = useState('')
  const [entityType, setEntityType] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')

  const queryArgs = useMemo(
    () => ({
      page,
      limit,
      action: action.trim() || undefined,
      entityType: entityType.trim() || undefined,
      start: start || undefined,
      end: end || undefined,
    }),
    [action, entityType, end, limit, page, start],
  )

  const { data, isLoading } = useListAuditLogsQuery(queryArgs)
  const logs = data?.data.items ?? []
  const total = data?.data.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <main className="page-shell">
      <section className="page-flex">
        <section className="card full-width">
          <p className="eyebrow">Audit logs</p>
          <h1>Immutable activity log</h1>
          <p className="subhead">View secured historical activity records for compliance and traceability.</p>
        </section>

        <section className="card full-width">
          <p className="muted">
            Seeing both "Created" and "Deleted" for the same document ID is normal; it means the same record was created, then later soft-deleted.
          </p>
          <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
            <div className="kpi-grid">
              <label>
                Action
                <Input value={action} onChange={(event) => setAction(event.target.value)} placeholder="CREATE / UPDATE / DELETE" />
              </label>
              <label>
                Entity
                <Input value={entityType} onChange={(event) => setEntityType(event.target.value)} placeholder="expenses" />
              </label>
              <label>
                Start
                <Input type="date" value={start} onChange={(event) => setStart(event.target.value)} />
              </label>
              <label>
                End
                <Input type="date" value={end} onChange={(event) => setEnd(event.target.value)} />
              </label>
              <label>
                Rows per page
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={limit}
                  onChange={(event) => setLimit(Math.min(100, Math.max(1, Number(event.target.value) || 25)))}
                />
              </label>
            </div>
            <div className="topbar-actions" style={{ justifyContent: 'flex-start' }}>
              <Button type="button" className="ghost-btn" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
                Previous
              </Button>
              <Button type="button" className="ghost-btn" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
                Next
              </Button>
              <Button type="button" className="ghost-btn" onClick={() => { setPage(1); setAction(''); setEntityType(''); setStart(''); setEnd('') }}>
                Reset
              </Button>
            </div>
          </form>
          {isLoading ? (
            <p className="muted">Loading audit logs...</p>
          ) : logs.length === 0 ? (
            <p className="muted">No audit activity yet.</p>
          ) : (
            <div className="form-grid">
              {logs.slice(0, 50).map((log, index) => (
                <article key={`${index}-${asText(log.documentId, 'log')}`} className="kpi-card">
                  <p><strong>{formatAction(log.action)}</strong> on {asText(log.entityType, 'entity')}</p>
                  <p className="muted">Document: {asText(log.documentId, '-')}</p>
                  <p className="muted">Time: {formatTimestamp(log.timestamp)}</p>
                </article>
              ))}
            </div>
          )}
          <p className="muted">Page {page} of {totalPages} • {total} records</p>
        </section>
      </section>
    </main>
  )
}