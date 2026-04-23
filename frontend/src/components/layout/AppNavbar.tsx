import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useLogoutMutation } from '../../features/auth/authApi'
import { clearCredentials } from '../../features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { Button } from '../ui/Button'

type ThemeMode = 'dark' | 'light'

type NavItem = {
  to: string
  label: string
}

const THEME_STORAGE_KEY = 'expense-tracker-theme'

export function AppNavbar() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const authUser = useAppSelector((state) => state.auth.user)
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialTheme: ThemeMode = storedTheme === 'light' || storedTheme === 'dark'
      ? storedTheme
      : prefersDark
        ? 'dark'
        : 'light'

    setTheme(initialTheme)
    document.documentElement.setAttribute('data-theme', initialTheme)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const navLinks = useMemo<NavItem[]>(() => {
    if (!accessToken) {
      return [
        { to: '/', label: 'Home' },
        { to: '/login', label: 'Sign in' },
        { to: '/signup', label: 'Sign up' },
      ]
    }

    return [
      { to: '/dashboard', label: 'Dashboard' },
      { to: '/reports', label: 'Reports' },
      { to: '/invoices', label: 'Invoices' },
      { to: '/audit', label: 'Audit' },
      ...(authUser?.role === 'admin' ? [{ to: '/staff', label: 'Staff' }] : []),
    ]
  }, [accessToken, authUser?.role])

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } finally {
      setIsMobileMenuOpen(false)
      dispatch(clearCredentials())
      navigate('/login')
    }
  }

  const handleThemeToggle = () => {
    setTheme((prev: ThemeMode) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((prev) => !prev)
  }

  return (
    <nav className="app-nav" aria-label="Global">
      <div className="app-nav-inner">
        <NavLink to={accessToken ? '/dashboard' : '/'} className="app-nav-brand">
          ExpenseTracker NG
        </NavLink>

        <button
          type="button"
          className="app-nav-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isMobileMenuOpen}
          aria-controls="app-mobile-nav-drawer"
        >
          <span aria-hidden="true">{isMobileMenuOpen ? '✕' : '☰'}</span>
        </button>

        <div className="app-nav-links">
          {navLinks.map((link: NavItem) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }: { isActive: boolean }) => `app-nav-link${isActive ? ' is-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="app-nav-meta">
          <button
            type="button"
            className={`theme-toggle-btn ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
            onClick={handleThemeToggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'dark'}
          >
            <span className="theme-toggle-icon" aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
          {accessToken && authUser ? (
            <>
              <span className="app-nav-user">
                <span>{authUser.name} • {authUser.role}</span>
                {authUser.role === 'admin' ? (
                  <span className="app-nav-company" title={`Company ID: ${authUser.companyId}`}>
                    {authUser.companyId}
                  </span>
                ) : null}
              </span>
              <Button type="button" className="ghost-btn app-nav-signout" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        className={`app-nav-mobile-backdrop${isMobileMenuOpen ? ' is-open' : ''}`}
        onClick={closeMobileMenu}
        aria-label="Close navigation drawer"
      />

      <aside
        id="app-mobile-nav-drawer"
        className={`app-nav-mobile-drawer${isMobileMenuOpen ? ' is-open' : ''}`}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="app-nav-mobile-drawer-header">
          <span className="app-nav-mobile-drawer-title">Menu</span>
          <button
            type="button"
            className="app-nav-mobile-close"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        <div className="app-nav-mobile-section">
          {navLinks.map((link: NavItem) => (
            <NavLink
              key={`mobile-${link.to}`}
              to={link.to}
              onClick={closeMobileMenu}
              className={({ isActive }: { isActive: boolean }) => `app-nav-link${isActive ? ' is-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="app-nav-mobile-section app-nav-mobile-meta">
          <button
            type="button"
            className={`theme-toggle-btn ${theme === 'dark' ? 'is-dark' : 'is-light'}`}
            onClick={handleThemeToggle}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            aria-pressed={theme === 'dark'}
          >
            <span className="theme-toggle-icon" aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

          {accessToken && authUser ? (
            <>
              <span className="app-nav-user app-nav-user-mobile">
                <span>{authUser.name} • {authUser.role}</span>
                {authUser.role === 'admin' ? (
                  <span className="app-nav-company" title={`Company ID: ${authUser.companyId}`}>
                    {authUser.companyId}
                  </span>
                ) : null}
              </span>
              <Button type="button" className="ghost-btn app-nav-signout" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </>
          ) : null}
        </div>
      </aside>
    </nav>
  )
}
