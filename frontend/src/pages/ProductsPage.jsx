import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductForm } from '../components/forms/ProductForm.jsx'
import { Button } from '../components/ui/Button.jsx'
import { EmptyState, ErrorState, FormPanel, LoadingState, MetricCard, MetricsStrip, PageHeader, inputClass } from '../components/ui/PageElements.jsx'
import { useInventory } from '../context/InventoryContext.jsx'

export function ProductsPage() {
  const { createProduct, deleteProduct, error, loading, products, refresh, reservations, tenants, updateProduct } = useInventory()
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const [query, setQuery] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return products.filter((product) => {
      const matchesQuery = !normalizedQuery || [product.sku, product.product_name, product.tenant_name].some((value) => value.toLowerCase().includes(normalizedQuery))
      const matchesTenant = !tenantFilter || product.tenant_id === Number(tenantFilter)
      return matchesQuery && matchesTenant
    })
  }, [products, query, tenantFilter])

  if (loading) return <LoadingState label="Loading products…" />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const closeForm = () => { setEditing(null); setFormOpen(false); setActionError('') }
  const saveProduct = async (values) => {
    setActionError('')
    try {
      if (editing) await updateProduct(editing.product_id, values)
      else await createProduct(values)
      closeForm()
    } catch (requestError) { setActionError(requestError.message) }
  }
  const removeProduct = async (product) => {
    if (!window.confirm(`Delete ${product.product_name}?`)) return
    setActionError('')
    try { await deleteProduct(product.product_id) } catch (requestError) { setActionError(requestError.message) }
  }
  const totalStock = products.reduce((sum, product) => sum + product.actual_stock, 0)

  return (
    <>
      <PageHeader
        action={<Button icon="plus" onClick={() => { setEditing(null); setFormOpen(true) }}>Add product</Button>}
        description="Manage product inventory across all tenants."
        title="Products"
      />
      <MetricsStrip>
        <MetricCard label="Total products" value={products.length} />
        <MetricCard label="Total stock" value={totalStock.toLocaleString()} />
        <MetricCard label="Reservations" value={reservations.length} />
        <MetricCard label="Tenants" value={tenants.length} />
      </MetricsStrip>
      {actionError ? <ErrorState message={actionError} /> : null}
      {formOpen ? (
        <FormPanel description="SKU must be unique within the selected tenant." title={editing ? 'Edit product' : 'Add product'}>
          <ProductForm key={editing?.product_id ?? 'new'} initialValue={editing} onCancel={closeForm} onSubmit={saveProduct} tenants={tenants} />
        </FormPanel>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="grid gap-3 border-b border-slate-200 p-4 sm:grid-cols-[1fr_220px]">
          <input aria-label="Search products" className={inputClass} onChange={(event) => setQuery(event.target.value)} placeholder="Search product, SKU, or tenant…" type="search" value={query} />
          <select aria-label="Filter by tenant" className={inputClass} onChange={(event) => setTenantFilter(event.target.value)} value={tenantFilter}>
            <option value="">All tenants</option>
            {tenants.map((tenant) => <option key={tenant.tenant_id} value={tenant.tenant_id}>{tenant.tenant_name}</option>)}
          </select>
        </div>
        {visibleProducts.length === 0 ? (
          <div className="p-5">
            <EmptyState
              action={products.length === 0
                ? <Button onClick={() => setFormOpen(true)}>Add product</Button>
                : <Button onClick={() => { setQuery(''); setTenantFilter('') }} variant="secondary">Clear filters</Button>}
              description={products.length === 0 ? 'Add a product to start building the inventory.' : 'Try a different search or tenant filter.'}
              title={products.length === 0 ? 'No products yet' : 'No products found'}
            />
          </div>
        ) : (
          <>
            <div className="hidden grid-cols-[110px_1.2fr_1fr_130px_100px_190px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
              <span>SKU</span><span>Product</span><span>Tenant</span><span>Price</span><span>Stock</span><span>Actions</span>
            </div>
            <div className="divide-y divide-slate-100">
              {visibleProducts.map((product) => (
                <article className="grid gap-4 px-5 py-5 md:grid-cols-[110px_1.2fr_1fr_130px_100px_190px] md:items-center md:py-4" key={product.product_id}>
                  <p className="font-bold text-slate-950">{product.sku}</p>
                  <Link className="font-semibold text-slate-950 hover:text-blue-700" to={`/products/${product.product_id}`}>{product.product_name}</Link>
                  <p className="text-sm text-slate-600"><span className="mr-2 text-xs font-bold uppercase text-slate-400 md:hidden">Tenant</span>{product.tenant_name}</p>
                  <p className="text-sm text-slate-700"><span className="mr-2 text-xs font-bold uppercase text-slate-400 md:hidden">Price</span>฿{product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  <p className="text-sm font-semibold"><span className="mr-2 text-xs font-bold uppercase text-slate-400 md:hidden">Stock</span>{product.actual_stock}</p>
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
                    <Button onClick={() => { setEditing(product); setFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }} variant="ghost">Edit</Button>
                    <Button onClick={() => removeProduct(product)} variant="danger">Delete</Button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  )
}
