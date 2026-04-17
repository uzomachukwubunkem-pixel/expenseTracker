import { useForm } from 'react-hook-form'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useCreateInvoiceMutation } from './invoiceApi'

interface InvoiceFormValues {
  buyerName: string
  buyerTaxId: string
  sellerName: string
  sellerTaxId: string
  total: number
  issuedAt: string
}

export function InvoicesPage() {
  const [createInvoice, { isLoading }] = useCreateInvoiceMutation()
  const { register, handleSubmit, reset, formState: { errors } } = useForm<InvoiceFormValues>({
    defaultValues: { issuedAt: new Date().toISOString().slice(0, 10) },
  })

  const onSubmit = async (values: InvoiceFormValues) => {
    await createInvoice({ ...values, total: Number(values.total) }).unwrap()
    reset({ issuedAt: new Date().toISOString().slice(0, 10) })
  }

  return (
    <main className="page-shell">
      <section className="page-flex">
        <section className="card full-width">
          <p className="eyebrow">Invoices</p>
          <h1>Create and issue invoices</h1>
          <p className="subhead">Capture buyer and seller details with tax IDs for compliant invoicing.</p>
        </section>

        <form className="card form-grid" onSubmit={handleSubmit(onSubmit)}>
          <label>
            Buyer name
            <Input {...register('buyerName', { required: true })} />
          </label>
          <label>
            Buyer tax ID
            <Input {...register('buyerTaxId', { required: true })} />
          </label>
          <label>
            Seller name
            <Input {...register('sellerName', { required: true })} />
          </label>
          <label>
            Seller tax ID
            <Input {...register('sellerTaxId', { required: true })} />
          </label>
          <label>
            Total
            <Input type="number" step="0.01" {...register('total', { required: true, valueAsNumber: true })} />
          </label>
          <label>
            Issued at
            <Input type="date" {...register('issuedAt', { required: true })} />
          </label>
          {(errors.buyerName || errors.buyerTaxId || errors.sellerName || errors.sellerTaxId || errors.total || errors.issuedAt) ? (
            <p className="error-text">Please complete all required fields.</p>
          ) : null}
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Creating...' : 'Create invoice'}</Button>
        </form>
      </section>
    </main>
  )
}