import { useState } from 'react'
import { Button } from '../ui/Button.jsx'
import { Field, inputClass } from '../ui/PageElements.jsx'

const initialForm = {
  tenant_id: '',
  sku: '',
  product_name: '',
  price: '',
  actual_stock: '',
}

export function ProductForm({ initialValue, tenants, onCancel, onSubmit }) {
  const [values, setValues] = useState(() =>
    initialValue
      ? {
          tenant_id: String(initialValue.tenant_id),
          sku: initialValue.sku,
          product_name: initialValue.product_name,
          price: String(initialValue.price),
          actual_stock: String(initialValue.actual_stock),
        }
      : initialForm,
  )
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const validate = () => {
    const nextErrors = {}
    if (!values.tenant_id) nextErrors.tenant_id = 'Tenant is required.'
    if (!values.sku.trim()) nextErrors.sku = 'SKU is required.'
    if (!values.product_name.trim()) nextErrors.product_name = 'Product name is required.'
    if (values.price === '' || Number(values.price) < 0) nextErrors.price = 'Price must be 0 or more.'
    if (values.actual_stock === '' || Number(values.actual_stock) < 0) nextErrors.actual_stock = 'Stock must be 0 or more.'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Field error={errors.tenant_id} label="Tenant">
          <select className={inputClass} onChange={update('tenant_id')} value={values.tenant_id}>
            <option value="">Select tenant</option>
            {tenants.map((tenant) => <option key={tenant.tenant_id} value={tenant.tenant_id}>{tenant.tenant_name}</option>)}
          </select>
        </Field>
        <Field error={errors.sku} label="SKU">
          <input className={inputClass} onChange={update('sku')} placeholder="e.g. KB001" value={values.sku} />
        </Field>
        <Field error={errors.product_name} label="Product name">
          <input className={inputClass} onChange={update('product_name')} placeholder="e.g. Keyboard" value={values.product_name} />
        </Field>
        <Field error={errors.price} label="Price">
          <input className={inputClass} min="0" onChange={update('price')} step="0.01" type="number" value={values.price} />
        </Field>
        <Field error={errors.actual_stock} label="Stock">
          <input className={inputClass} min="0" onChange={update('actual_stock')} step="1" type="number" value={values.actual_stock} />
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <Button onClick={onCancel} variant="secondary">Cancel</Button>
        <Button disabled={submitting} type="submit">{submitting ? 'Saving…' : 'Save product'}</Button>
      </div>
    </form>
  )
}
