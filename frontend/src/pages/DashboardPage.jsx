import { Link } from 'react-router-dom'
import { useInventory } from '../context/InventoryContext.jsx'
import { ErrorState, LoadingState, MetricCard, MetricsStrip, PageHeader, StatusBadge } from '../components/ui/PageElements.jsx'

const quickLinks = [
  { title: 'Manage tenants', description: 'Create and maintain inventory owners.', to: '/tenants' },
  { title: 'Manage products', description: 'Review catalog, price, and stock.', to: '/products' },
  { title: 'Review reservations', description: 'Track reservation records and status.', to: '/reservations' },
]

export function DashboardPage() {
  const { error, loading, products, refresh, reservations, tenants } = useInventory()

  if (loading) return <LoadingState label="Loading dashboard…" />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const totalStock = products.reduce((sum, product) => sum + product.actual_stock, 0)

  return (
    <>
      <PageHeader description="A current overview of the mock inventory dataset." title="Dashboard" />
      <MetricsStrip>
        <MetricCard label="Total tenants" value={tenants.length} />
        <MetricCard label="Total products" value={products.length} />
        <MetricCard label="Total stock" value={totalStock.toLocaleString()} />
        <MetricCard label="Total reservations" value={reservations.length} />
      </MetricsStrip>

      <section className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-950">Recent reservations</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {reservations.length === 0 ? <p className="px-5 py-8 text-sm text-slate-500">No reservations yet.</p> : reservations.slice(0, 4).map((reservation) => (
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" key={reservation.reservation_id}>
                <div>
                  <p className="font-semibold text-slate-950">{reservation.product_name}</p>
                  <p className="mt-1 text-sm text-slate-500">#{reservation.reservation_id} · {reservation.tenant_name} · Qty {reservation.reserved_qty}</p>
                </div>
                <StatusBadge status={reservation.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-bold text-slate-950">Quick access</h2>
          <div className="mt-3 divide-y divide-slate-100">
            {quickLinks.map((item) => (
              <Link className="block py-4 first:pt-2 hover:text-blue-700" key={item.to} to={item.to}>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">{item.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
