import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductForm } from '../components/forms/ProductForm.jsx'
import { Button } from '../components/ui/Button.jsx'
import { ErrorState, FormPanel, LoadingState, PageHeader, StatusBadge } from '../components/ui/PageElements.jsx'
import { useInventory } from '../context/InventoryContext.jsx'

export function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { deleteProduct, error, loading, products, refresh, reservations, tenants, updateProduct } = useInventory()
  const [editing, setEditing] = useState(false)
  const [actionError, setActionError] = useState('')

  if (loading) return <LoadingState label="Loading product…" />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const product = products.find((item) => item.product_id === Number(id))
  if (!product) return <ErrorState message="Product not found." />
  const productReservations = reservations.filter((reservation) => reservation.product_id === product.product_id)

  const saveProduct = async (values) => {
    setActionError('')
    try { await updateProduct(product.product_id, values); setEditing(false) } catch (requestError) { setActionError(requestError.message) }
  }
  const removeProduct = async () => {
    if (!window.confirm(`Delete ${product.product_name}?`)) return
    setActionError('')
    try { await deleteProduct(product.product_id); navigate('/products') } catch (requestError) { setActionError(requestError.message) }
  }

  return (
    <>
      <Link className="text-sm font-semibold text-blue-700 hover:text-blue-800" to="/products">← Back to products</Link>
      <PageHeader
        action={<div className="flex gap-2"><Button onClick={() => setEditing(true)} variant="secondary">Edit</Button><Button onClick={removeProduct} variant="danger">Delete</Button></div>}
        description={`${product.sku} · ${product.tenant_name}`}
        title={product.product_name}
      />
      {actionError ? <ErrorState message={actionError} /> : null}
      {editing ? <FormPanel title="Edit product"><ProductForm initialValue={product} onCancel={() => setEditing(false)} onSubmit={saveProduct} tenants={tenants} /></FormPanel> : null}
      <section className="grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Tenant', product.tenant_name],
          ['Price', `฿${product.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
          ['Actual stock', product.actual_stock],
          ['Product ID', `#${product.product_id}`],
        ].map(([label, value]) => <div className="bg-white p-5" key={label}><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-950">{value}</p></div>)}
      </section>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold">Related reservations</h2></div>
        {productReservations.length === 0 ? <p className="px-5 py-8 text-sm text-slate-500">No reservations for this product.</p> : productReservations.map((reservation) => (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0" key={reservation.reservation_id}>
            <div><p className="font-semibold">Reservation #{reservation.reservation_id}</p><p className="mt-1 text-sm text-slate-500">Quantity {reservation.reserved_qty}</p></div>
            <StatusBadge status={reservation.status} />
          </div>
        ))}
      </section>
    </>
  )
}
