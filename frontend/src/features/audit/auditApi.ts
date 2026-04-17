import { api } from '../../app/api'

export const auditApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listAuditLogs: builder.query<
      {
        success: boolean
        data: {
          items: Array<Record<string, unknown>>
          total: number
          page: number
          limit: number
        }
      },
      {
        page?: number
        limit?: number
        action?: string
        entityType?: string
        start?: string
        end?: string
      }
    >({
      query: (params) => ({
        url: '/audit-logs',
        params,
      }),
      providesTags: ['Alert'],
    }),
  }),
})

export const { useListAuditLogsQuery } = auditApi