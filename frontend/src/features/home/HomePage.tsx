import { Link, Navigate } from 'react-router-dom'
import { useAppSelector } from '../../hooks/redux'
import chartImage from '../../assets/finance-chart.svg'
import walletImage from '../../assets/finance-wallet.svg'
import invoiceImage from '../../assets/finance-invoice.svg'

export function HomePage() {
  const accessToken = useAppSelector((state) => state.auth.accessToken)

  if (accessToken) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <main className="page-shell home-shell">
      <div className="home-shell-orb home-shell-orb-a" aria-hidden="true" />
      <div className="home-shell-orb home-shell-orb-b" aria-hidden="true" />
      <div className="home-shell-grid" aria-hidden="true" />

      <header className="home-topbar" role="banner">
        <div className="home-brand">
          <span className="home-mark" aria-hidden="true">ET</span>
          <span className="home-brand-name">ExpenseTracker NG</span>
        </div>

        <Link to="/signup" className="home-topbar-link">
          Get started
        </Link>
      </header>

      <section className="home-hero" aria-label="product introduction">
        <div className="home-hero-copy">
          <p className="eyebrow home-eyebrow">Built for Nigerian SMEs</p>
          <h1>Run your business finances with clarity and control</h1>
          <p className="subhead home-subhead">
            Manage expenses, invoices, and compliance workflows in one modern workspace designed for real Nigerian operations.
          </p>

          <div className="home-actions">
            <Link to="/signup" className="primary-btn home-link-btn">
              Start free
            </Link>
            <Link to="/login" className="ghost-btn home-link-btn">
              Sign in
            </Link>
          </div>

          <div className="home-pill-row" aria-label="core value propositions">
            <span className="home-pill">VAT/CIT/WHT aware</span>
            <span className="home-pill">Audit-ready logs</span>
            <span className="home-pill">Verification code onboarding</span>
          </div>

          <div className="feature-grid home-feature-grid">
            <article className="feature-card home-feature-card">
              <h3>Tax-aware dashboard</h3>
              <p>Instant turnover monitoring against the N50m VAT threshold.</p>
            </article>
            <article className="feature-card home-feature-card">
              <h3>Expense intelligence</h3>
              <p>Track categories, VAT input, and spend trends without noise.</p>
            </article>
            <article className="feature-card home-feature-card">
              <h3>Secure sign-in</h3>
              <p>Email verification codes and recovery links protect access.</p>
            </article>
          </div>
        </div>

        <div className="home-hero-visual" aria-label="animated finance illustration">
          <div className="home-visual-card home-visual-card-large">
            <img src={chartImage} alt="Animated finance chart illustration" />
          </div>
          <div className="home-visual-stack">
            <div className="home-visual-card home-visual-card-small home-visual-wallet">
              <img src={walletImage} alt="Finance wallet illustration" />
            </div>
            <div className="home-visual-card home-visual-card-small home-visual-invoice">
              <img src={invoiceImage} alt="Finance invoice illustration" />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}