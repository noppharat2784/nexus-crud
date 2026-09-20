import { useState } from 'react'
import { Link } from 'react-router-dom'
import { TenantForm } from '../components/forms/TenantForm.jsx'
import { Button } from '../components/ui/Button.jsx'
import { EmptyState, ErrorState, FormPanel, LoadingState, PageHeader } from '../components/ui/PageElements.jsx'
import { useInventory } from '../context/InventoryContext.jsx'

export function TenantsPage() {
  const { createTenant, deleteTenant, error, loading, products, refresh, tenants, updateTenant } = useInventory()
  const [editing, setEditing] = useState(null)
  const [formOpen, setFormOpen] = useState(false)
  const [actionError, setActionError] = useState('')

  if (loading) return <LoadingState label="Loading tenants…" />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const closeForm = () => { setEditing(null); setFormOpen(false); setActionError('') }
  const saveTenant = async (values) => {
    setActionError('')
    try {
      if (editing) await updateTenant(editing.tenant_id, values)
      else await createTenant(values)
      closeForm()
    } catch (requestError) {
      setActionError(requestError.message)
    }
  }
  const removeTenant = async (tenant) => {
    if (!window.confirm(`Delete ${tenant.tenant_name}?`)) return
    setActionError('')
    try { await deleteTenant(tenant.tenant_id) } catch (requestError) { setActionError(requestError.message) }
  }

  return (
    <>
      <PageHeader
        action={<Button icon="plus" onClick={() => { setEditing(null); setFormOpen(true) }}>Add tenant</Button>}
        description="Create and maintain the tenants that own product inventory."
        title="Tenants"
      />
      {actionError ? <ErrorState message={actionError} /> : null}
      {formOpen ? (
        <FormPanel description="Tenant names are required." title={editing ? 'Edit tenant' : 'Add tenant'}>
          <TenantForm key={editing?.tenant_id ?? 'new'} initialValue={editing} onCancel={closeForm} onSubmit={saveTenant} />
        </FormPanel>
      ) : null}

      {tenants.length === 0 ? (
        <EmptyState action={<Button onClick={() => setFormOpen(true)}>Add tenant</Button>} description="Add a tenant before creating products." title="No tenants yet" />
      ) : (
        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="hidden grid-cols-[90px_1fr_140px_220px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 sm:grid">
            <span>ID</span><span>Tenant</span><span>Products</span><span>Actions</span>
          </div>
          <div className="divide-y divide-slate-100">
            {tenants.map((tenant) => (
              <div className="grid gap-4 px-5 py-4 sm:grid-cols-[90px_1fr_140px_220px] sm:items-center" key={tenant.tenant_id}>
                <span className="text-sm text-slate-500">#{tenant.tenant_id}</span>
                <Link className="font-semibold text-slate-950 hover:text-blue-700" to={`/tenants/${tenant.tenant_id}`}>{tenant.tenant_name}</Link>
                <span className="text-sm text-slate-600">{products.filter((product) => product.tenant_id === tenant.tenant_id).length}</span>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => { setEditing(tenant); setFormOpen(true) }} variant="ghost">Edit</Button>
                  <Button onClick={() => removeTenant(tenant)} variant="danger">Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
