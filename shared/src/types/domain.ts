import type { Role } from './tax.js'

export interface ExpenseDTO {
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

export interface InvoiceDTO {
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

export interface UserDTO {
  id?: string
  name: string
  email: string
  role: Role
}
