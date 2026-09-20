import { ErrorState, LoadingState, MetricCard, MetricsStrip, PageHeader, StatusBadge } from '../components/ui/PageElements.jsx'
import { useInventory } from '../context/InventoryContext.jsx'

export function ReportsPage() {
  const { error, loading, products, refresh, reservations } = useInventory()
  if (loading) return <LoadingState label="Loading reports…" />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const totalStock = products.reduce((sum, product) => sum + product.actual_stock, 0)
  const reservedQuantity = reservations.filter((reservation) => reservation.status === 'RESERVED').reduce((sum, reservation) => sum + reservation.reserved_qty, 0)
  const statusCounts = ['RESERVED', 'COMMITTED', 'RELEASED'].map((status) => ({ status, count: reservations.filter((reservation) => reservation.status === status).length }))

  return (
    <>
      <PageHeader description="Summaries derived from the current mock source records." title="Reports" />
      <MetricsStrip columns={3}>
        <MetricCard label="Product lines" value={products.length} />
        <MetricCard label="Total stock" value={totalStock.toLocaleString()} />
        <MetricCard label="Reserved quantity" value={reservedQuantity.toLocaleString()} />
      </MetricsStrip>
      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold">Product stock report</h2></div>
          <div className="divide-y divide-slate-100">
            {products.length === 0 ? <p className="px-5 py-8 text-sm text-slate-500">No products available for this report.</p> : products.map((product) => (
              <div className="grid gap-2 px-5 py-4 sm:grid-cols-[90px_1fr_1fr_100px] sm:items-center" key={product.product_id}>
                <p className="font-bold">{product.sku}</p><p>{product.product_name}</p><p className="text-sm text-slate-500">{product.tenant_name}</p><p className="font-semibold">Stock {product.actual_stock}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold">Reservation summary</h2></div>
          <div className="divide-y divide-slate-100">
            {statusCounts.map(({ status, count }) => (
              <div className="flex items-center justify-between px-5 py-4" key={status}><StatusBadge status={status} /><span className="text-2xl font-bold">{count}</span></div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
