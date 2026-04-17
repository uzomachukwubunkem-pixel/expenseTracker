import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useAppSelector } from '../../hooks/redux'
import { useListUsersQuery, useUpdateUserRoleMutation, useUpdateUserStatusMutation } from './usersApi'

export function StaffManagementPage() {
  const authUser = useAppSelector((state) => state.auth.user)
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(25)

  const isAdmin = authUser?.role === 'admin'

  const { data, isLoading, error, refetch, isFetching } = useListUsersQuery(
    { page, limit, role: 'staff', q },
    { skip: !isAdmin },
  )

  const [updateRole, { isLoading: isUpdatingRole }] = useUpdateUserRoleMutation()
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateUserStatusMutation()

  if (!isAdmin) {
    return (
      <main className="page-shell">
        <section className="card">
          <h1>Staff Management</h1>
          <p className="error-text">Only admins can access this page.</p>
          <Link to="/dashboard" className="ghost-btn home-link-btn">Back to dashboard</Link>
        </section>
      </main>
    )
  }

  const list = data?.data.items ?? []
  const total = data?.data.total ?? 0
  const canGoPrev = page > 1
  const canGoNext = page * limit < total

  return (
    <main className="page-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Admin Controls</p>
          <h1>Staff Management</h1>
          <p className="subhead">View staff accounts, deactivate compromised accounts, and promote trusted users.</p>
        </div>
        <div className="topbar-actions">
          <Link to="/dashboard" className="ghost-btn home-link-btn">Dashboard</Link>
          <Button type="button" className="ghost-btn" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </header>

      <section className="card full-width">
        <form
          className="form-grid"
          onSubmit={(event) => {
            event.preventDefault()
            setPage(1)
            refetch()
          }}
        >
          <label>
            Search by name or email
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search staff" />
          </label>
          <label>
            Rows per page
            <Input
              type="number"
              min="1"
              max="100"
              value={limit}
              onChange={(event) => {
                setLimit(Math.min(100, Math.max(1, Number(event.target.value) || 25)))
                setPage(1)
              }}
            />
          </label>
          <Button type="submit">Apply filters</Button>
        </form>
      </section>

      <section className="table-wrap" aria-label="Staff list">
        <div className="table-head">
          <h2>Staff Accounts</h2>
          <p className="muted">Total: {total}</p>
        </div>

        {isLoading ? <p>Loading staff accounts...</p> : null}
        {error ? <p className="error-text">Could not load staff accounts.</p> : null}

        {!isLoading && !error ? (
          <div className="desktop-table">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="muted">No staff accounts found.</td>
                  </tr>
                ) : (
                  list.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.isEmailVerified ? 'Yes' : 'No'}</td>
                      <td>
                        <span className={`status-chip ${user.isActive ? 'ok' : 'pending'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{user.role}</td>
                      <td>
                        <div className="topbar-actions">
                          <Button
                            type="button"
                            className="ghost-btn"
                            disabled={isUpdatingStatus}
                            onClick={() => updateStatus({ userId: user.id, isActive: !user.isActive })}
                          >
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                          <Button
                            type="button"
                            className="ghost-btn"
                            disabled={isUpdatingRole || user.role === 'admin'}
                            onClick={() => updateRole({ userId: user.id, role: 'admin' })}
                          >
                            Make admin
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        <div className="topbar-actions">
          <Button type="button" className="ghost-btn" onClick={() => setPage((value) => value - 1)} disabled={!canGoPrev}>
            Previous
          </Button>
          <p className="muted">Page {page}</p>
          <Button type="button" className="ghost-btn" onClick={() => setPage((value) => value + 1)} disabled={!canGoNext}>
            Next
          </Button>
        </div>
      </section>
    </main>
  )
}
