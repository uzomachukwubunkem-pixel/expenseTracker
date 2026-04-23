import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useSendVerificationCodeMutation, useVerifyEmailCodeMutation } from './authApi'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ApiFieldError = {
  path?: string
  message?: string
}

const getErrorData = (error: unknown): { message?: string; errors?: ApiFieldError[] } | null => {
  if (typeof error !== 'object' || error === null) return null

  const maybeWithData = error as { data?: unknown }
  if (typeof maybeWithData.data !== 'object' || maybeWithData.data === null) return null

  return maybeWithData.data as { message?: string; errors?: ApiFieldError[] }
}

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const defaultEmail = (params.get('email') ?? '').trim().toLowerCase()
  const companyId = (params.get('companyId') ?? '').trim()

  const [email, setEmail] = useState(defaultEmail)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const [verifyEmailCode, { isLoading: isVerifying }] = useVerifyEmailCodeMutation()
  const [sendVerificationCode, { isLoading: isResending }] = useSendVerificationCodeMutation()

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setInfo('')

    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }

    if (code.trim().length !== 6) {
      setError('Verification code must be 6 digits.')
      return
    }

    try {
      await verifyEmailCode({ email: email.trim(), code: code.trim() }).unwrap()
      setInfo('Email verified successfully. You can now sign in.')
      navigate('/login')
    } catch (err: unknown) {
      const data = getErrorData(err)
      const detailedIssue = data?.errors?.[0]
      const detailedMessage = detailedIssue
        ? `${detailedIssue.path ? `${detailedIssue.path}: ` : ''}${detailedIssue.message}`
        : undefined
      setError(detailedMessage ?? data?.message ?? 'Could not verify email code')
    }
  }

  const handleResend = async () => {
    setError('')
    setInfo('')

    if (!emailPattern.test(email.trim())) {
      setError('Enter a valid email address before requesting a new code.')
      return
    }

    try {
      await sendVerificationCode({ email: email.trim() }).unwrap()
      setInfo('A new verification code has been sent to your email.')
    } catch (err: unknown) {
      setError(getErrorData(err)?.message ?? 'Could not resend verification code')
    }
  }

  return (
    <main className="page-shell auth-shell">
      <section className="card auth-card">
        <h1>Verify your email</h1>
        {companyId ? (
          <p className="info-text">
            Your company ID is <strong>{companyId}</strong>. Share it with staff so they can register under your company.
          </p>
        ) : null}
        <form className="form-grid" onSubmit={handleVerify}>
          <label>
            Email
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value.trim().toLowerCase())} />
          </label>
          <label>
            Verification code
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
          </label>

          {error ? <p className="error-text">{error}</p> : null}
          {info ? <p className="info-text">{info}</p> : null}

          <Button type="submit" disabled={isVerifying || code.trim().length !== 6 || !emailPattern.test(email.trim())}>
            {isVerifying ? 'Verifying...' : 'Verify email'}
          </Button>
          <Button type="button" className="ghost-btn" disabled={isResending} onClick={handleResend}>
            {isResending ? 'Resending...' : 'Resend code'}
          </Button>
        </form>

        <p className="auth-switch">
          Back to <Link to="/login">Sign in</Link>
        </p>
      </section>
    </main>
  )
}