import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useRequestPasswordResetMutation, useResetPasswordMutation } from './authApi'

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

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const defaultEmail = params.get('email') ?? ''
  const defaultToken = params.get('token') ?? ''

  const [email, setEmail] = useState(defaultEmail)
  const [token, setToken] = useState(defaultToken)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [requestPasswordReset, { isLoading: isRequesting }] = useRequestPasswordResetMutation()
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation()

  const handleRequestReset = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setInfo('')

    try {
      await requestPasswordReset({ email }).unwrap()
      setInfo('If the account exists, a reset link has been sent to that email address.')
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not send password reset link'))
    }
  }

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setInfo('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      await resetPassword({ email, token, password }).unwrap()
      setInfo('Password updated successfully. You can now sign in.')
      navigate('/login')
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not reset password'))
    }
  }

  return (
    <main className="page-shell auth-shell">
      <section className="card auth-card">
        <h1>Reset password</h1>

        <form className="form-grid" onSubmit={defaultToken ? handleResetPassword : handleRequestReset}>
          <label>
            Email
            <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>

          {defaultToken ? (
            <>
              <label>
                Reset token
                <Input type="text" value={token} onChange={(event) => setToken(event.target.value)} />
              </label>
              <label>
                New password
                <div className="password-field">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
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
              <label>
                Confirm new password
                <div className="password-field">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    <PasswordVisibilityIcon visible={showConfirmPassword} />
                  </button>
                </div>
              </label>
            </>
          ) : null}

          {error ? <p className="error-text">{error}</p> : null}
          {info ? <p className="info-text">{info}</p> : null}

          <Button type="submit" disabled={defaultToken ? isResetting : isRequesting}>
            {defaultToken ? (isResetting ? 'Updating password...' : 'Update password') : isRequesting ? 'Sending link...' : 'Send reset link'}
          </Button>
        </form>

        <p className="auth-switch">
          Back to <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  )
}
