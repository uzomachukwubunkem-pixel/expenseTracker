import { lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppNavbar } from '../components/layout/AppNavbar'
import { useAppSelector } from '../hooks/redux'

const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const ReportsPage = lazy(() =>
  import('../features/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })),
)
const InvoicesPage = lazy(() =>
  import('../features/invoices/InvoicesPage').then((m) => ({ default: m.InvoicesPage })),
)
const AuditLogsPage = lazy(() =>
  import('../features/audit/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })),
)
const StaffManagementPage = lazy(() =>
  import('../features/users/StaffManagementPage').then((m) => ({ default: m.StaffManagementPage })),
)
const HomePage = lazy(() =>
  import('../features/home/HomePage').then((m) => ({ default: m.HomePage })),
)
const LoginPage = lazy(() =>
  import('../features/auth/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('../features/auth/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const VerifyEmailPage = lazy(() =>
  import('../features/auth/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })),
)
const ResetPasswordPage = lazy(() =>
  import('../features/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)

function RequireAuth({ children }: { children: ReactNode }) {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const isBootstrapping = useAppSelector((state) => state.auth.isBootstrapping)

  if (isBootstrapping) {
    return <main className="page-shell">Loading...</main>
  }

  if (!accessToken) return <Navigate to="/login" replace />
  return children
}

function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const isBootstrapping = useAppSelector((state) => state.auth.isBootstrapping)

  if (isBootstrapping) {
    return <main className="page-shell">Loading...</main>
  }

  if (accessToken) return <Navigate to="/dashboard" replace />
  return children
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <AppNavbar />
        <div className="app-content">
          <Suspense fallback={<div className="page-shell">Loading...</div>}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/dashboard"
                element={
                  <RequireAuth>
                    <DashboardPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/reports"
                element={
                  <RequireAuth>
                    <ReportsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/invoices"
                element={
                  <RequireAuth>
                    <InvoicesPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/audit"
                element={
                  <RequireAuth>
                    <AuditLogsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/staff"
                element={
                  <RequireAuth>
                    <StaffManagementPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/login"
                element={
                  <RedirectIfAuthenticated>
                    <LoginPage />
                  </RedirectIfAuthenticated>
                }
              />
              <Route
                path="/signup"
                element={
                  <RedirectIfAuthenticated>
                    <RegisterPage />
                  </RedirectIfAuthenticated>
                }
              />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
        <footer className="app-footer" role="contentinfo">
          <div className="app-footer-inner">
            <p>ExpenseTracker NG</p>
            <p className="muted">Built for secure, company-scoped financial operations.</p>
            <p className="muted">© {new Date().getFullYear()} ExpenseTracker NG. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  )
}
