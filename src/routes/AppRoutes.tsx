import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import StoreLayout from '../layouts/StoreLayout'
import RouteBoundary from './RouteBoundary'
import GuestOnly from '../auth/GuestOnly'
import RequireAuth from '../auth/RequireAuth'

const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const SignupPage = lazy(() => import('../pages/auth/SignupPage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const PosPage = lazy(() => import('../pages/pos/PosPage'))
const ProductsPage = lazy(() => import('../pages/products/ProductsPage'))
const CategoriesPage = lazy(() => import('../pages/categories/CategoriesPage'))
const InventoryPage = lazy(() => import('../pages/inventory/InventoryPage'))
const SalesPage = lazy(() => import('../pages/sales/SalesPage'))
const SalePrintPage = lazy(() => import('../pages/sales/SalePrintPage'))
const CustomersPage = lazy(() => import('../pages/customers/CustomersPage'))
const CustomerStatementPage = lazy(() => import('../pages/customers/CustomerStatementPage'))
const PaymentPrintPage = lazy(() => import('../pages/customers/PaymentPrintPage'))
const ReportsPage = lazy(() => import('../pages/reports/ReportsPage'))
const CashClosingPage = lazy(() => import('../pages/cash/CashClosingPage'))
const SubscriptionPage = lazy(() => import('../pages/subscription/SubscriptionPage'))
const SubscriptionCheckoutPage = lazy(
  () => import('../pages/subscription/SubscriptionCheckoutPage'),
)
const SubscriptionPaymentPage = lazy(() => import('../pages/subscription/SubscriptionPaymentPage'))
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

export default function AppRoutes() {
  return (
    <RouteBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/sales/:saleId/print" element={<SalePrintPage />} />
          <Route path="/customers/:customerId/statement" element={<CustomerStatementPage />} />
          <Route
            path="/customers/:customerId/payments/:paymentId/print"
            element={<PaymentPrintPage />}
          />
          <Route element={<StoreLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/pos" element={<PosPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/cash-closing" element={<CashClosingPage />} />
            <Route path="/subscription" element={<SubscriptionPage />} />
            <Route path="/subscription/checkout" element={<SubscriptionCheckoutPage />} />
            <Route path="/subscription/payments/:orderId" element={<SubscriptionPaymentPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RouteBoundary>
  )
}
