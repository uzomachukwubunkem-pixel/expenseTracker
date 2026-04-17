import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@expense-tracker/shared'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLoginMutation } from './authApi'
import { setCredentials } from './authSlice'
import { useAppDispatch } from '../../hooks/redux'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'

interface LoginValues {
  email: string
  password: string
}

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

export function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [login, { isLoading }] = useLoginMutation()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  const { register, handleSubmit } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginValues) => {
    setError('')

    try {
      const response = await login(values).unwrap()
      dispatch(setCredentials({ ...response.data, rememberMe }))
      navigate('/dashboard')
    } catch (err: any) {
      const message = err?.data?.message ?? 'Sign in failed'
      if (typeof message === 'string' && message.toLowerCase().includes('not verified')) {
        navigate(`/verify-email?email=${encodeURIComponent(values.email)}`)
        return
      }
      setError(message)
    }
  }

  return (
    <main className="page-shell auth-shell">
      <section className="card auth-card">
        <h1>Sign in</h1>
        <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
          <label>
            Email
            <Input type="email" {...register('email')} />
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
          </label>
          <label className="remember-row">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
            />
            <span>Remember me</span>
          </label>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
          {error ? <p className="error-text">{error}</p> : null}
        </form>
        <p className="auth-switch">
          Need an account? <Link to="/signup">Sign up</Link>
        </p>
        <p className="auth-switch">
          <Link to="/reset-password">Forgot password?</Link>
        </p>
      </section>
    </main>
  )
}
