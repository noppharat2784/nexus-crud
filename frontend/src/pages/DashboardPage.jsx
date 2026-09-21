import { useMemo, useState } from 'react'

import {
  ProductStockBarChart,
  StockDistributionPie,
} from '../components/charts/InventoryCharts.jsx'
import { TENANT_COLORS } from '../components/charts/chartTokens.js'
import { EmptyState, ErrorState, LoadingState, MetricCard, MetricsStrip, PageHeader } from '../components/ui/PageElements.jsx'
import { useInventory } from '../context/InventoryContext.jsx'
import { buildProductStock, buildStockAnalytics } from '../lib/inventoryAnalytics.js'

function Panel({ title, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function DashboardPage() {
  const { error, loading, products, refresh, tenants } = useInventory()
  const [selectedTenantId, setSelectedTenantId] = useState(null)

  const stockAnalytics = useMemo(
    () => buildStockAnalytics(tenants, products),
    [products, tenants],
  )
  const activeTenantId = tenants.some((tenant) => tenant.tenant_id === selectedTenantId)
    ? selectedTenantId
    : tenants[0]?.tenant_id ?? null
  const selectedTenant = tenants.find((tenant) => tenant.tenant_id === activeTenantId)
  const productStock = useMemo(
    () => buildProductStock(products, activeTenantId),
    [activeTenantId, products],
  )
  const tenantStock = stockAnalytics.byTenant.map((tenant, index) => ({
    ...tenant,
    color: TENANT_COLORS[index % TENANT_COLORS.length],
  }))

  if (loading) return <LoadingState label="Loading stock dashboard…" />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <>
      <PageHeader
        description="Stock distribution across Nexus and each tenant."
        title="Stock Dashboard"
      />

      <MetricsStrip columns={3}>
        <MetricCard label="Total stock" tone="blue" value={stockAnalytics.totalStock.toLocaleString()} />
        <MetricCard label="Tenants" tone="blue" value={tenants.length.toLocaleString()} />
        <MetricCard label="Products" tone="blue" value={products.length.toLocaleString()} />
      </MetricsStrip>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <Panel title="Nexus stock distribution">
          {stockAnalytics.totalStock === 0 ? (
            <div className="p-5">
              <EmptyState description="Add stock to a product to see how inventory is distributed across tenants." title="No stock to visualize" />
            </div>
          ) : (
            <div className="grid items-center gap-2 p-5 md:grid-cols-[minmax(0,1fr)_190px]">
              <StockDistributionPie data={tenantStock.filter((tenant) => tenant.stock > 0)} />
              <div className="space-y-4">
                {tenantStock.map((tenant) => (
                  <div className="flex items-start gap-3" key={tenant.tenant_id}>
                    <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: tenant.color }} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-700">{tenant.tenant_name}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{tenant.stock.toLocaleString()} units · {tenant.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
                <div className="border-t border-slate-200 pt-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total</p>
                  <p className="mt-1 text-3xl font-bold text-slate-950">{stockAnalytics.totalStock.toLocaleString()} <span className="text-base font-semibold text-slate-500">units</span></p>
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Stock by product">
          <div className="border-b border-slate-100 px-5 py-3">
            <label className="sr-only" htmlFor="dashboard-tenant">Tenant</label>
            <select
              className="min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-56"
              disabled={tenants.length === 0}
              id="dashboard-tenant"
              onChange={(event) => setSelectedTenantId(Number(event.target.value))}
              value={activeTenantId ?? ''}
            >
              {tenants.length === 0 ? <option value="">No tenants</option> : null}
              {tenants.map((tenant) => <option key={tenant.tenant_id} value={tenant.tenant_id}>{tenant.tenant_name}</option>)}
            </select>
          </div>
          {productStock.length === 0 ? (
            <div className="p-5">
              <EmptyState description={`${selectedTenant?.tenant_name ?? 'This tenant'} has no products to display.`} title="No product stock" />
            </div>
          ) : (
            <div className="p-5"><ProductStockBarChart data={productStock} /></div>
          )}
        </Panel>
      </div>

      <Panel title="Tenant summary">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">#</th><th className="px-5 py-3">Store</th><th className="px-5 py-3 text-right">Quantity</th><th className="px-5 py-3 text-right">Percentage</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenantStock.map((tenant, index) => (
                <tr key={tenant.tenant_id}>
                  <td className="px-5 py-4 text-slate-500">{index + 1}</td>
                  <td className="px-5 py-4 font-semibold text-slate-950"><span className="mr-3 inline-block size-2.5 rounded-full" style={{ backgroundColor: tenant.color }} />{tenant.tenant_name}</td>
                  <td className="px-5 py-4 text-right font-semibold">{tenant.stock.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right text-slate-600">{tenant.percentage.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  )
}
