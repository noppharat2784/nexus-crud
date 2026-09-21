import { useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import {
  EmptyState,
  ErrorState,
  FormPanel,
  LoadingState,
  PageHeader,
} from '../components/ui/PageElements.jsx'
import { useInventory } from '../context/InventoryContext.jsx'

function formatCreatedAt(value) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString()
}

export function StockMovementsPage() {
  const {
    createStockMovement,
    error,
    loading,
    products,
    refresh,
    stockMovements,
  } = useInventory()

  const [productId, setProductId] = useState('')
  const [movementType, setMovementType] = useState('IN')
  const [quantity, setQuantity] = useState('')
  const [actionError, setActionError] = useState('')

  if (loading) {
    return <LoadingState label="Loading stock movements..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={refresh} />
  }

  const selectedProduct = products.find(
    (product) => product.product_id === Number(productId),
  )

  const saveMovement = async (event) => {
    event.preventDefault()
    setActionError('')

    if (!productId) {
      setActionError('Please select a product.')
      return
    }

    if (Number(quantity) <= 0) {
      setActionError('Quantity must be greater than zero.')
      return
    }

    try {
      await createStockMovement({
        product_id: Number(productId),
        movement_type: movementType,
        quantity: Number(quantity),
      })

      setQuantity('')
    } catch (requestError) {
      setActionError(requestError.message)
    }
  }

  return (
    <>
      <PageHeader
        description="Record stock receiving and stock issuing while keeping a movement history."
        title="Stock Movements"
      />

      {actionError ? <ErrorState message={actionError} /> : null}

      <FormPanel
        description="Stock IN increases actual stock. Stock OUT decreases stock only when enough stock is available."
        title="Record stock movement"
      >
        <form className="space-y-5" onSubmit={saveMovement}>
          <div className="grid gap-5 md:grid-cols-3">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Product
              </span>

              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setProductId(event.target.value)}
                value={productId}
              >
                <option value="">Select product</option>

                {products.map((product) => (
                  <option
                    key={product.product_id}
                    value={product.product_id}
                  >
                    {product.product_name} - {product.sku}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Movement type
              </span>

              <select
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                onChange={(event) => setMovementType(event.target.value)}
                value={movementType}
              >
                <option value="IN">Stock IN</option>
                <option value="OUT">Stock OUT</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">
                Quantity
              </span>

              <input
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                min="1"
                onChange={(event) => setQuantity(event.target.value)}
                placeholder="Enter quantity"
                type="number"
                value={quantity}
              />
            </label>
          </div>

          {selectedProduct ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Current stock
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-950">
                {selectedProduct.actual_stock}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {selectedProduct.product_name} · {selectedProduct.sku}
              </p>
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button
              disabled={products.length === 0}
              type="submit"
            >
              Record movement
            </Button>
          </div>
        </form>
      </FormPanel>

      {stockMovements.length === 0 ? (
        <EmptyState
          description="Record a Stock IN or Stock OUT transaction to create the first movement history entry."
          title="No stock movements yet"
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[170px_1fr_1fr_100px_80px_150px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
            <span>Date</span>
            <span>Product</span>
            <span>Tenant</span>
            <span>Type</span>
            <span>Qty</span>
            <span>Stock</span>
          </div>

          <div className="divide-y divide-slate-100">
            {stockMovements.map((movement) => (
              <article
                className="grid gap-4 px-5 py-5 md:grid-cols-[170px_1fr_1fr_100px_80px_150px] md:items-center md:py-4"
                key={movement.movement_id}
              >
                <p className="text-sm text-slate-600">
                  {formatCreatedAt(movement.created_at)}
                </p>

                <div>
                  <p className="font-semibold text-slate-950">
                    {movement.product_name}
                  </p>

                  <p className="text-xs text-slate-500">
                    {movement.sku}
                  </p>
                </div>

                <p className="text-sm text-slate-600">
                  {movement.tenant_name}
                </p>

                <div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                      movement.movement_type === 'IN'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {movement.movement_type}
                  </span>
                </div>

                <p className="font-semibold text-slate-950">
                  {movement.quantity}
                </p>

                <p className="text-sm font-semibold text-slate-700">
                  {movement.stock_before} → {movement.stock_after}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
