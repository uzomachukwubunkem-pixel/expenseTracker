import { useMemo } from 'react'
import { useListExpensesQuery } from '../features/expenses/expenseApi'

export const useExpenses = () => {
  const query = useListExpensesQuery({ page: 1, limit: 20 })

  const totals = useMemo(() => {
    const items = query.data?.data.items ?? []
    const amount = items.reduce((sum, item) => sum + item.amount, 0)
    const vat = items.reduce((sum, item) => sum + (item.inputVAT ?? 0), 0)
    return { amount, vat }
  }, [query.data])

  return {
    ...query,
    totals,
  }
}
