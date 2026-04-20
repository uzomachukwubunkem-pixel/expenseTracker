import { api } from '../../app/api'

interface InvoiceDTO {
  id?: string
  companyId?: string
  invoiceNumber: string
  buyerName: string
  buyerTaxId: string
  sellerName: string
  sellerTaxId: string
  total: number
  status: 'draft' | 'issued' | 'paid' | 'void'
  issuedAt: string
}


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