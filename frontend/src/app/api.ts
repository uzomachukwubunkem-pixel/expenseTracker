import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as { auth: { accessToken?: string } }).auth.accessToken
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
    credentials: 'include',
  }),
  tagTypes: ['Expense', 'Invoice', 'Alert', 'TaxSummary', 'CompanySettings', 'User'],
  endpoints: () => ({}),
})
