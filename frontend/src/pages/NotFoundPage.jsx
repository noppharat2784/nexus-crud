import { Link } from 'react-router-dom'
export function NotFoundPage() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-widest text-blue-700">404</p>
      <h1 className="mt-3 text-3xl font-bold text-slate-950">Page not found</h1>
      <p className="mt-2 text-sm text-slate-500">The requested Nexus Inventory page does not exist.</p>
      <Link className="mt-6 inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700" to="/">Return to dashboard</Link>
    </div>
  )
}
