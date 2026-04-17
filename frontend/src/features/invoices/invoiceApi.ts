import type { InvoiceDTO } from '@expense-tracker/shared'
import { api } from '../../app/api'

interface CreateInvoiceResponse {
  success: boolean
  data: InvoiceDTO
}

export const invoiceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createInvoice: builder.mutation<CreateInvoiceResponse, Partial<InvoiceDTO>>({
      query: (body) => ({
        url: '/invoices',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['CompanySettings', 'TaxSummary'],
    }),
  }),
})

export const { useCreateInvoiceMutation } = invoiceApi