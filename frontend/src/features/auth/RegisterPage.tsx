import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegisterMutation } from './authApi'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

const registerFormSchema = z
  .object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').max(100),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').max(100),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
    confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters').max(100),
    companyId: z.string().max(100, 'Company ID is too long').optional(),
    role: z.enum(['staff', 'admin']),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'staff' && !data.companyId?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['companyId'],
        message: 'Company ID is required for staff accounts',
      })
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterValues = z.infer<typeof registerFormSchema>

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M1.5 12s3.5-6 10.5-6 10.5 6 10.5 6-3.5 6-10.5 6S1.5 12 1.5 12z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      {visible ? <path d="M3 21L21 3" fill="none" stroke="currentColor" strokeWidth="1.8" /> : null}
    </svg>
  )
}

export function RegisterPage() {
  const navigate = useNavigate()
  const [registerUser, { isLoading }] = useRegisterMutation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      role: 'staff',
    },
  })

  const selectedRole = watch('role')
  const isStaffRole = selectedRole === 'staff'

  const onSubmit = async (values: RegisterValues) => {
    await registerUser({
      name: `${values.firstName.trim()} ${values.lastName.trim()}`.trim(),
      email: values.email,
      password: values.password,
      companyId: values.companyId?.trim() ? values.companyId.trim() : undefined,
      role: values.role,
    }).unwrap()
    navigate(`/verify-email?email=${encodeURIComponent(values.email)}`)
  }

  return (
    <main className="page-shell auth-shell">
      <section className="card auth-card">
        <h1>Sign up</h1>
        <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
          <label>
            First name
            <Input type="text" {...register('firstName')} />
            {errors.firstName ? <p className="error-text">{errors.firstName.message}</p> : null}
          </label>
          <label>
            Last name
            <Input type="text" {...register('lastName')} />
            {errors.lastName ? <p className="error-text">{errors.lastName.message}</p> : null}
          </label>
          <label>
            Email
            <Input type="email" {...register('email')} />
            {errors.email ? <p className="error-text">{errors.email.message}</p> : null}
          </label>
          <label>
            Password
            <div className="password-field">
              <Input type={showPassword ? 'text' : 'password'} {...register('password')} />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((value) => !value)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <PasswordVisibilityIcon visible={showPassword} />
              </button>
            </div>
            {errors.password ? <p className="error-text">{errors.password.message}</p> : null}
          </label>
          <label>
            Confirm password
            <div className="password-field">
              <Input type={showConfirmPassword ? 'text' : 'password'} {...register('confirmPassword')} />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                <PasswordVisibilityIcon visible={showConfirmPassword} />
              </button>
            </div>
            {errors.confirmPassword ? <p className="error-text">{errors.confirmPassword.message}</p> : null}
          </label>
          <label>
            Company ID
            <Input
              type="text"
              placeholder={isStaffRole ? 'Ask your admin for the company ID' : 'Leave blank to create one'}
              {...register('companyId')}
            />
            {errors.companyId ? <p className="error-text">{errors.companyId.message}</p> : null}
            <p className="muted">
              {isStaffRole
                ? 'Required for staff. Use the company ID provided by your admin.'
                : 'Optional for admins. Leave blank to create a new company ID automatically.'}
            </p>
          </label>
          <label>
            Role
            <select className="form-input" {...register('role')}>
              <option value="staff">Staff - join an existing company</option>
              <option value="admin">Admin - create a new company</option>
            </select>
          </label>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>
        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  )
}