import { useEffect, useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useLogoutMutation } from '../../features/auth/authApi'
import { clearCredentials } from '../../features/auth/authSlice'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { Button } from '../ui/Button'

type ThemeMode = 'dark' | 'light'

const THEME_STORAGE_KEY = 'expense-tracker-theme'

export function AppNavbar() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation()
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const authUser = useAppSelector((state) => state.auth.user)
  const [theme, setTheme] = useState<ThemeMode>('dark')

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

  const navLinks = useMemo(() => {
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
      dispatch(clearCredentials())
      navigate('/login')
    }
  }

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  return (
    <nav className="app-nav" aria-label="Global">
      <div className="app-nav-inner">
        <NavLink to={accessToken ? '/dashboard' : '/'} className="app-nav-brand">
          ExpenseTracker NG
        </NavLink>

        <div className="app-nav-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `app-nav-link${isActive ? ' is-active' : ''}`}
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
              <span className="app-nav-user">{authUser.name} • {authUser.role}</span>
              <Button type="button" className="ghost-btn app-nav-signout" onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  )
}
