import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell.jsx'
import { InventoryProvider } from './context/InventoryContext.jsx'
import { DashboardPage } from './pages/DashboardPage.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { ProductDetailPage } from './pages/ProductDetailPage.jsx'
import { ProductsPage } from './pages/ProductsPage.jsx'
import { ReportsPage } from './pages/ReportsPage.jsx'
import { ReservationsPage } from './pages/ReservationsPage.jsx'
import { TenantDetailPage } from './pages/TenantDetailPage.jsx'
import { TenantsPage } from './pages/TenantsPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <InventoryProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route element={<DashboardPage />} index />
            <Route element={<TenantsPage />} path="tenants" />
            <Route element={<TenantDetailPage />} path="tenants/:id" />
            <Route element={<ProductsPage />} path="products" />
            <Route element={<ProductDetailPage />} path="products/:id" />
            <Route element={<ReservationsPage />} path="reservations" />
            <Route element={<ReportsPage />} path="reports" />
            <Route element={<NotFoundPage />} path="*" />
          </Route>
        </Routes>
      </InventoryProvider>
    </BrowserRouter>
  )
}

export default App
