import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLoginMutation } from './authApi'
import { setCredentials } from './authSlice'
import { useAppDispatch } from '../../hooks/redux'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'



const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error !== 'object' || error === null) return fallback

  const maybeWithData = error as { data?: { message?: unknown } }
  const message = maybeWithData.data?.message
  return typeof message === 'string' ? message : fallback
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
  const [formData, setFormData] = useState({ email:"", password: ""})
  const [login, { isLoading }] = useLoginMutation()
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)


  const onSubmit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setError('')

    try {
      const response = await login(formData).unwrap()
      dispatch(setCredentials({ ...response.data, rememberMe }))
      navigate('/dashboard')
    } catch (err: unknown) {
      const message = getErrorMessage(err, 'Sign in failed')
      if (typeof message === 'string' && message.toLowerCase().includes('not verified')) {
        navigate(`/verify-email?email=${formData.email}`)
        return
      }
      setError(message)
    }
  }

  return (
    <main className="page-shell auth-shell">
      <section className="card auth-card">
        <h1>Sign in</h1>
        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Email
            <Input type="email" onChange={(event) => setFormData({...formData, email: event.target.value})} />
          </label>
          <label>
            Password
            <div className="password-field">
              <Input type={showPassword ? 'text' : 'password'} onChange={(event) => setFormData({...formData, password: event.target.value})}/>
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
