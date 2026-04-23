import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query'
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { clearCredentials, setAccessToken } from '../features/auth/authSlice'

type RootState = {
  auth: {
    accessToken?: string
  }
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api/v1',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken
    if (token) headers.set('authorization', `Bearer ${token}`)
    return headers
  },
  credentials: 'include',
})

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions,
) => {
  let result = await rawBaseQuery(args, api, extraOptions)

  const isRefreshCall = typeof args !== 'string' && args.url === '/auth/refresh'
  if (result.error?.status === 401 && !isRefreshCall) {
    const refreshResult = await rawBaseQuery(
      {
        url: '/auth/refresh',
        method: 'POST',
      },
      api,
      extraOptions,
    )

    const refreshData = refreshResult.data as { data?: { accessToken?: string } } | undefined
    const nextAccessToken = refreshData?.data?.accessToken

    if (nextAccessToken) {
      api.dispatch(setAccessToken(nextAccessToken))
      result = await rawBaseQuery(args, api, extraOptions)
    } else {
      api.dispatch(clearCredentials())
    }
  }

  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Expense', 'Invoice', 'Alert', 'TaxSummary', 'CompanySettings', 'User'],
  endpoints: () => ({}),
})
