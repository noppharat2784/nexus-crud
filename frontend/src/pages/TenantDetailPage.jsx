import { Link, useParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState, PageHeader } from '../components/ui/PageElements.jsx'
import { useInventory } from '../context/InventoryContext.jsx'

export function TenantDetailPage() {
  const { id } = useParams()
  const { error, loading, products, refresh, tenants } = useInventory()

  if (loading) return <LoadingState label="Loading tenant…" />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const tenant = tenants.find((item) => item.tenant_id === Number(id))
  if (!tenant) return <ErrorState message="Tenant not found." />
  const tenantProducts = products.filter((product) => product.tenant_id === tenant.tenant_id)

  return (
    <>
      <Link className="text-sm font-semibold text-blue-700 hover:text-blue-800" to="/tenants">← Back to tenants</Link>
      <PageHeader description={`Tenant ID #${tenant.tenant_id}`} title={tenant.tenant_name} />
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-medium text-slate-500">Products owned</p>
        <p className="mt-1 text-3xl font-bold text-slate-950">{tenantProducts.length}</p>
      </section>
      {tenantProducts.length === 0 ? (
        <EmptyState action={<Link className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" to="/products">Add a product</Link>} description="This tenant does not own any products yet." title="No products" />
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {tenantProducts.map((product) => (
            <Link className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0 hover:bg-slate-50" key={product.product_id} to={`/products/${product.product_id}`}>
              <div><p className="font-semibold text-slate-950">{product.product_name}</p><p className="mt-1 text-sm text-slate-500">{product.sku}</p></div>
              <div className="text-right"><p className="font-semibold">Stock {product.actual_stock}</p><p className="mt-1 text-sm text-slate-500">{product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
            </Link>
          ))}
        </section>
      )}
    </>
  )
}
