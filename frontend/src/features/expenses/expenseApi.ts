import { api } from '../../app/api'

 interface ExpenseDTO {
  id?: string
  userId?: string
  amount: number
  description: string
  category: string
  date: string
  amountExcludingVAT?: number
  inputVAT?: number
  deletedAt?: string | null
}


type ExpenseRecord = ExpenseDTO & { _id?: string }

const normalizeExpense = (expense: ExpenseRecord): ExpenseDTO => ({
  ...expense,
  id: expense.id ?? expense._id,
})

interface ExpenseListResponse {
  success: boolean
  data: {
    items: Array<ExpenseDTO>
    total: number
    page: number
    limit: number
  }
}

export const expenseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listExpenses: builder.query<ExpenseListResponse, { page?: number; limit?: number }>({
      query: (params) => ({
        url: '/expenses',
        params,
      }),
      transformResponse: (response: { success: boolean; data: { items: Array<ExpenseRecord>; total: number; page: number; limit: number } }) => ({
        ...response,
        data: {
          ...response.data,
          items: response.data.items.map(normalizeExpense),
        },
      }),
      providesTags: ['Expense'],
    }),
    createExpense: builder.mutation<{ success: boolean; data: ExpenseDTO }, Partial<ExpenseDTO>>({
      query: (body) => ({
        url: '/expenses',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { success: boolean; data: ExpenseRecord }) => ({
        ...response,
        data: normalizeExpense(response.data),
      }),
      invalidatesTags: ['Expense', 'TaxSummary'],
    }),
    deleteExpense: builder.mutation<{ success: boolean; message: string; data: ExpenseDTO }, string>({
      query: (id) => ({
        url: `/expenses/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response: { success: boolean; message: string; data: ExpenseRecord }) => ({
        ...response,
        data: normalizeExpense(response.data),
      }),
      invalidatesTags: ['Expense', 'TaxSummary'],
    }),
  }),
})

export const { useListExpensesQuery, useCreateExpenseMutation, useDeleteExpenseMutation } = expenseApi
