import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext'
import AdminLayout     from './components/layout/AdminLayout'
import LoginPage       from './pages/LoginPage'
import DashboardPage   from './pages/DashboardPage'
import OrdersPage      from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
import ProductsPage    from './pages/ProductsPage'
import MessagesPage    from './pages/MessagesPage'
import LoyaltyPage     from './pages/LoyaltyPage'
import NewsletterPage  from './pages/NewsletterPage'
import SpecialDaysPage from './pages/SpecialDaysPage'
import DeliveryZonesPage from './pages/DeliveryZonesPage'
import AnalyticsPage   from './pages/AnalyticsPage'
import StaffPage        from './pages/StaffPage'

function RequireAuth({ children }) {
  // AdminAuthContext exposes 'admin' (not 'token') — check admin object
  const { admin, loading } = useAdminAuth()

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0E0600' }}>
      <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: '#B8752A', borderTopColor: 'transparent' }} />
    </div>
  )

  return admin ? children : <Navigate to="/login" replace />
}

function ProtectedLayout({ children }) {
  return (
    <RequireAuth>
      <AdminLayout>{children}</AdminLayout>
    </RequireAuth>
  )
}

export default function App() {
  return (
    <AdminAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route path="/dashboard"    element={<ProtectedLayout><DashboardPage /></ProtectedLayout>} />
          <Route path="/analytics"    element={<ProtectedLayout><AnalyticsPage /></ProtectedLayout>} />
          <Route path="/orders"       element={<ProtectedLayout><OrdersPage /></ProtectedLayout>} />
          <Route path="/orders/:id"   element={<ProtectedLayout><OrderDetailPage /></ProtectedLayout>} />
          <Route path="/products"     element={<ProtectedLayout><ProductsPage /></ProtectedLayout>} />
          <Route path="/messages"     element={<ProtectedLayout><MessagesPage /></ProtectedLayout>} />
          <Route path="/loyalty"      element={<ProtectedLayout><LoyaltyPage /></ProtectedLayout>} />
          <Route path="/newsletter"   element={<ProtectedLayout><NewsletterPage /></ProtectedLayout>} />
          <Route path="/special-days" element={<ProtectedLayout><SpecialDaysPage /></ProtectedLayout>} />
          <Route path="/delivery-zones" element={<ProtectedLayout><DeliveryZonesPage /></ProtectedLayout>} />
          <Route path="/staff"         element={<ProtectedLayout><StaffPage /></ProtectedLayout>} />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AdminAuthProvider>
  )
}
