import { useMemo } from 'react'

import {
  ReservationStatusDonut,
  TenantStatusBarChart,
} from '../components/charts/InventoryCharts.jsx'
import { STATUS_COLORS } from '../components/charts/chartTokens.js'
import { EmptyState, ErrorState, LoadingState, MetricCard, MetricsStrip, PageHeader } from '../components/ui/PageElements.jsx'
import { useInventory } from '../context/InventoryContext.jsx'
import { buildReservationAnalytics } from '../lib/inventoryAnalytics.js'

function ReportPanel({ title, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  )
}

export function ReportsPage() {
  const { error, loading, refresh, reservations, tenants } = useInventory()
  const analytics = useMemo(
    () => buildReservationAnalytics(tenants, reservations),
    [reservations, tenants],
  )

  if (loading) return <LoadingState label="Loading reservation reports…" />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  return (
    <>
      <PageHeader
        description="Reserved quantities by status across Nexus and each tenant."
        title="Reservation Reports"
      />

      <MetricsStrip>
        <MetricCard label="Total reserved quantity" value={analytics.total.toLocaleString()} />
        <MetricCard label="Reserved" tone="blue" value={analytics.totals.RESERVED.toLocaleString()} />
        <MetricCard label="Committed" tone="emerald" value={analytics.totals.COMMITTED.toLocaleString()} />
        <MetricCard label="Released" tone="slate" value={analytics.totals.RELEASED.toLocaleString()} />
      </MetricsStrip>

      <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <ReportPanel title="Nexus reservation status">
          {analytics.total === 0 ? (
            <div className="p-5">
              <EmptyState description="Create a reservation to see quantities grouped by status." title="No reservations to visualize" />
            </div>
          ) : (
            <div className="grid items-center gap-2 p-5 md:grid-cols-[minmax(0,1fr)_170px] xl:grid-cols-1 2xl:grid-cols-[minmax(0,1fr)_170px]">
              <ReservationStatusDonut data={analytics.statusTotals.filter((item) => item.quantity > 0)} total={analytics.total} />
              <div className="space-y-4">
                {analytics.statusTotals.map((item) => (
                  <div className="flex items-start gap-3" key={item.status}>
                    <span className="mt-1 size-3 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.status] }} />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.status}</p>
                      <p className="mt-0.5 text-sm text-slate-500">{item.quantity.toLocaleString()} units · {item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ReportPanel>

        <ReportPanel title="Status by tenant">
          {tenants.length === 0 ? (
            <div className="p-5"><EmptyState description="Add a tenant to compare reservation quantities." title="No tenant data" /></div>
          ) : (
            <div className="p-5">
              <TenantStatusBarChart data={analytics.byTenant} />
              <div className="mt-2 flex flex-wrap justify-center gap-x-6 gap-y-2 border-t border-slate-100 pt-4">
                {Object.entries(STATUS_COLORS).map(([status, color]) => (
                  <span className="flex items-center gap-2 text-xs font-semibold text-slate-600" key={status}>
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />{status}
                  </span>
                ))}
              </div>
            </div>
          )}
        </ReportPanel>
      </div>

      <ReportPanel title="Tenant status totals">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-3">Tenant</th><th className="px-5 py-3 text-right">Reserved</th><th className="px-5 py-3 text-right">Committed</th><th className="px-5 py-3 text-right">Released</th><th className="px-5 py-3 text-right">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.byTenant.map((tenant) => (
                <tr key={tenant.tenant_id}>
                  <td className="px-5 py-4 font-semibold text-slate-950">{tenant.tenant_name}</td>
                  <td className="px-5 py-4 text-right text-blue-700">{tenant.RESERVED.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right text-emerald-700">{tenant.COMMITTED.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right text-slate-600">{tenant.RELEASED.toLocaleString()}</td>
                  <td className="px-5 py-4 text-right font-bold text-slate-950">{tenant.total.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ReportPanel>
    </>
  )
}
