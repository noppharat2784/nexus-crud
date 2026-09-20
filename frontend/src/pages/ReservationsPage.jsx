import { useState } from 'react'
import { ReservationForm } from '../components/forms/ReservationForm.jsx'
import { Button } from '../components/ui/Button.jsx'
import { EmptyState, ErrorState, FormPanel, LoadingState, PageHeader, StatusBadge } from '../components/ui/PageElements.jsx'
import { useInventory } from '../context/InventoryContext.jsx'

export function ReservationsPage() {
  const { createReservation, deleteReservation, error, loading, products, refresh, reservations, updateReservation } = useInventory()
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [actionError, setActionError] = useState('')

  if (loading) return <LoadingState label="Loading reservations…" />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const closeForm = () => { setEditing(null); setFormOpen(false); setActionError('') }
  const saveReservation = async (values) => {
    setActionError('')
    try {
      if (editing) await updateReservation(editing.reservation_id, values)
      else await createReservation(values)
      closeForm()
    } catch (requestError) { setActionError(requestError.message) }
  }
  const removeReservation = async (reservation) => {
    if (!window.confirm(`Delete reservation #${reservation.reservation_id}?`)) return
    setActionError('')
    try { await deleteReservation(reservation.reservation_id) } catch (requestError) { setActionError(requestError.message) }
  }

  return (
    <>
      <PageHeader
        action={<Button disabled={products.length === 0} icon="plus" onClick={() => { setEditing(null); setFormOpen(true) }}>Add reservation</Button>}
        description="Manage basic reservation records. V1 is not concurrency-safe or overselling-safe."
        title="Reservations"
      />
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
        Reservation records are for CRUD learning only and do not guarantee product availability.
      </div>
      {actionError ? <ErrorState message={actionError} /> : null}
      {formOpen ? (
        <FormPanel description="Quantity must be greater than zero." title={editing ? 'Edit reservation' : 'Add reservation'}>
          <ReservationForm key={editing?.reservation_id ?? 'new'} initialValue={editing} onCancel={closeForm} onSubmit={saveReservation} products={products} />
        </FormPanel>
      ) : null}

      {reservations.length === 0 ? (
        <EmptyState action={products.length > 0 ? <Button onClick={() => setFormOpen(true)}>Add reservation</Button> : null} description="Create a basic reservation record for a product." title="No reservations yet" />
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[120px_1fr_1fr_80px_130px_190px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 md:grid">
            <span>ID</span><span>Product</span><span>Tenant</span><span>Qty</span><span>Status</span><span>Actions</span>
          </div>
          <div className="divide-y divide-slate-100">
            {reservations.map((reservation) => (
              <article className="grid gap-4 px-5 py-5 md:grid-cols-[120px_1fr_1fr_80px_130px_190px] md:items-center md:py-4" key={reservation.reservation_id}>
                <p className="font-bold text-slate-950">#{reservation.reservation_id}</p>
                <p className="font-semibold">{reservation.product_name}</p>
                <p className="text-sm text-slate-600"><span className="mr-2 text-xs font-bold uppercase text-slate-400 md:hidden">Tenant</span>{reservation.tenant_name}</p>
                <p className="text-sm"><span className="mr-2 text-xs font-bold uppercase text-slate-400 md:hidden">Qty</span>{reservation.reserved_qty}</p>
                <div><StatusBadge status={reservation.status} /></div>
                <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 md:border-0 md:pt-0">
                  <Button onClick={() => { setEditing(reservation); setFormOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }} variant="ghost">Edit</Button>
                  <Button onClick={() => removeReservation(reservation)} variant="danger">Delete</Button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
