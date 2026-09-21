import { Button } from './Button.jsx'
import { Icon } from './Icon.jsx'

export function PageHeader({ title, description, action }) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {action}
    </header>
  )
}

export function MetricCard({ label, value, detail, tone = 'default' }) {
  const valueStyles = {
    default: 'text-slate-950',
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
    slate: 'text-slate-500',
  }

  return (
    <div className="min-w-0 bg-white px-5 py-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-3xl font-bold tracking-tight ${valueStyles[tone]}`}>{value}</p>
      {detail ? <p className="mt-1 text-xs text-slate-500">{detail}</p> : null}
    </div>
  )
}

export function MetricsStrip({ children, columns = 4 }) {
  const columnClass = columns === 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-2 xl:grid-cols-4'
  return (
    <section className={`grid gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 ${columnClass}`}>
      {children}
    </section>
  )
}

export function FormPanel({ title, description, children }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}

export function LoadingState({ label = 'Loading inventory data…' }) {
  return (
    <div className="flex min-h-52 items-center justify-center rounded-xl border border-slate-200 bg-white">
      <div className="text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
        <p className="mt-3 text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  )
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 text-center">
      <div className="rounded-xl bg-slate-100 p-3 text-slate-500"><Icon name="products" /></div>
      <h2 className="mt-4 text-lg font-bold text-slate-950">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-800" role="alert">
      <p className="font-semibold">Unable to complete this request.</p>
      <p className="mt-1 text-sm">{message}</p>
      {onRetry ? <Button className="mt-4" icon="retry" onClick={onRetry} variant="secondary">Retry</Button> : null}
    </div>
  )
}

export function StatusBadge({ status }) {
  const styles = {
    RESERVED: 'bg-blue-50 text-blue-700 ring-blue-200',
    COMMITTED: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    RELEASED: 'bg-slate-100 text-slate-600 ring-slate-200',
  }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${styles[status]}`}>{status}</span>
}

export function Field({ label, error, children }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <span className="mt-1.5 block">{children}</span>
      {error ? <span className="mt-1 block text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  )
}

export const inputClass =
  'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
