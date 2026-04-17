import { api } from '../../app/api'

interface CompanySettingsResponse {
  success: boolean
  data: {
    legalName: string
    taxId: string
    yearlyTurnover: number
  }
}

interface CompanySettingsPayload {
  legalName: string
  taxId: string
  yearlyTurnover: number
}

interface TaxSummaryResponse {
  success: boolean
  data: Record<string, unknown>
}

interface VatReturnResponse {
  success: boolean
  data: Record<string, unknown>
}

interface CitReturnResponse {
  success: boolean
  data: Record<string, unknown>
}

export const reportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    taxSummary: builder.query<TaxSummaryResponse, { start: string; end: string }>({
      query: (params) => ({
        url: '/reports/tax-summary',
        params,
      }),
      providesTags: ['TaxSummary'],
    }),
    alerts: builder.query<{ success: boolean; data: Array<Record<string, unknown>> }, void>({
      query: () => '/reports/alerts',
      providesTags: ['Alert'],
    }),
    vatReturn: builder.query<VatReturnResponse, { format?: 'json' | 'excel' | 'pdf'; start?: string; end?: string }>({
      query: (params) => ({
        url: '/reports/vat-return',
        params,
      }),
    }),
    citReturn: builder.query<CitReturnResponse, { year: number }>({
      query: (params) => ({
        url: '/reports/cit-return',
        params,
      }),
    }),
    companySettings: builder.query<CompanySettingsResponse, void>({
      query: () => '/reports/company-settings',
      providesTags: ['CompanySettings'],
    }),
    upsertCompanySettings: builder.mutation<CompanySettingsResponse, CompanySettingsPayload>({
      query: (body) => ({
        url: '/reports/company-settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['CompanySettings', 'TaxSummary'],
    }),
  }),
})

export const {
  useTaxSummaryQuery,
  useAlertsQuery,
  useVatReturnQuery,
  useCitReturnQuery,
  useCompanySettingsQuery,
  useUpsertCompanySettingsMutation,
} = reportApi
