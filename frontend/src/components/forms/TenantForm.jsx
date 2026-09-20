import { useState } from 'react'
import { Button } from '../ui/Button.jsx'
import { Field, inputClass } from '../ui/PageElements.jsx'

export function TenantForm({ initialValue, onCancel, onSubmit }) {
  const [name, setName] = useState(initialValue?.tenant_name ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Tenant name is required.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({ tenant_name: trimmedName })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <Field error={error} label="Tenant name">
        <input
          autoFocus
          className={inputClass}
          onChange={(event) => { setName(event.target.value); setError('') }}
          placeholder="e.g. Nexus Store"
          value={name}
        />
      </Field>
      <div className="flex flex-wrap justify-end gap-3">
        <Button onClick={onCancel} variant="secondary">Cancel</Button>
        <Button disabled={submitting} type="submit">{submitting ? 'Saving…' : 'Save tenant'}</Button>
      </div>
    </form>
  )
}
