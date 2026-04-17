import { useForm } from 'react-hook-form'
import { useCreateExpenseMutation } from './expenseApi'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

interface ExpenseFormValues {
  amount: number
  description: string
  category: string
  date: string
}

export function ExpenseForm() {
  const [createExpense, { isLoading }] = useCreateExpenseMutation()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormValues>({
    defaultValues: { date: new Date().toISOString().slice(0, 10) },
  })

  const onSubmit = async (values: ExpenseFormValues) => {
    await createExpense({
      ...values,
      amount: Number(values.amount),
    }).unwrap()
    reset({ date: new Date().toISOString().slice(0, 10) })
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit(onSubmit)}>
      <h2>Add Expense</h2>
      <label>
        Amount
        <Input
          type="number"
          step="0.01"
          {...register('amount', { required: true, valueAsNumber: true })}
        />
      </label>
      <label>
        Description
        <Input {...register('description', { required: true })} />
      </label>
      <label>
        Category
        <Input {...register('category', { required: true })} />
      </label>
      <label>
        Date
        <Input type="date" {...register('date', { required: true })} />
      </label>
      {(errors.amount || errors.description || errors.category || errors.date) && (
        <p className="error-text">Please complete all required fields.</p>
      )}
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save Expense'}
      </Button>
    </form>
  )
}
