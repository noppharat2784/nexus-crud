import { useState } from 'react'
import { Button } from '../ui/Button.jsx'
import { Field, inputClass } from '../ui/PageElements.jsx'

export function ReservationForm({ initialValue, onCancel, onSubmit, products }) {
  const [values, setValues] = useState(() => ({
    product_id: initialValue ? String(initialValue.product_id) : '',
    reserved_qty: initialValue ? String(initialValue.reserved_qty) : '',
    status: initialValue?.status ?? 'RESERVED',
  }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }))
    setErrors((current) => ({ ...current, [field]: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!values.product_id) nextErrors.product_id = 'Product is required.'
    if (values.reserved_qty === '' || Number(values.reserved_qty) <= 0) nextErrors.reserved_qty = 'Quantity must be more than 0.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await onSubmit(values)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field error={errors.product_id} label="Product">
          <select className={inputClass} onChange={update('product_id')} value={values.product_id}>
            <option value="">Select product</option>
            {products.map((product) => <option key={product.product_id} value={product.product_id}>{product.product_name} · {product.sku}</option>)}
          </select>
        </Field>
        <Field error={errors.reserved_qty} label="Reserved quantity">
          <input className={inputClass} min="1" onChange={update('reserved_qty')} step="1" type="number" value={values.reserved_qty} />
        </Field>
        <Field label="Status">
          <select className={inputClass} onChange={update('status')} value={values.status}>
            <option value="RESERVED">RESERVED</option>
            <option value="COMMITTED">COMMITTED</option>
            <option value="RELEASED">RELEASED</option>
          </select>
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <Button onClick={onCancel} variant="secondary">Cancel</Button>
        <Button disabled={submitting} type="submit">{submitting ? 'Saving…' : 'Save reservation'}</Button>
      </div>
    </form>
  )
}
