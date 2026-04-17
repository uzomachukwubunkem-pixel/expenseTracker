import { useState } from 'react'
import { useListExpensesQuery } from './expenseApi'
import { useDeleteExpenseMutation } from './expenseApi'
import { formatNaira } from '../../utils/formatHelpers'

export function ExpenseList() {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [deleteExpense, { isLoading: isDeleting }] = useDeleteExpenseMutation()
  const { data, isLoading } = useListExpensesQuery({ page: 1, limit: 20 })

  if (isLoading) {
    return <div className="card">Loading expenses...</div>
  }

  const items = data?.data.items ?? []

  const handleDelete = async (expenseId?: string) => {
    if (!expenseId) return
    const confirmed = window.confirm('Delete this expense? This will archive it from the list.')
    if (!confirmed) return

    setPendingDeleteId(expenseId)
    try {
      await deleteExpense(expenseId).unwrap()
    } finally {
      setPendingDeleteId(null)
    }
  }

  return (
    <section className="table-wrap" aria-label="Recent expenses">
      <div className="table-head">
        <h2>Recent Expenses</h2>
      </div>

      <div className="desktop-table" role="region" aria-label="Expense table">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Input VAT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((expense, index) => (
              <tr key={expense.id ?? `${expense.date}-${index}`}>
                <td>{expense.date.slice(0, 10)}</td>
                <td>{expense.category}</td>
                <td>{expense.description}</td>
                <td>{formatNaira(expense.amount)}</td>
                <td>{formatNaira(expense.inputVAT ?? 0)}</td>
                <td>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => handleDelete(expense.id)}
                    disabled={isDeleting && pendingDeleteId === expense.id}
                  >
                    {isDeleting && pendingDeleteId === expense.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-cards" aria-label="Expense cards for small screens">
        {items.map((expense, index) => (
          <article key={`${expense.id ?? index}-card`} className="expense-card">
            <div className="expense-card-row">
              <h3>{expense.category}</h3>
              <span className="status-chip ok">Posted</span>
            </div>
            <p>{expense.date.slice(0, 10)}</p>
            <p>{expense.description}</p>
            <p>Amount: {formatNaira(expense.amount)}</p>
            <p>Input VAT: {formatNaira(expense.inputVAT ?? 0)}</p>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => handleDelete(expense.id)}
              disabled={isDeleting && pendingDeleteId === expense.id}
            >
              {isDeleting && pendingDeleteId === expense.id ? 'Deleting...' : 'Delete'}
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
