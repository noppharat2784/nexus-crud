import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Icon } from '../ui/Icon.jsx'

const navigation = [
  { label: 'Dashboard', to: '/', icon: 'dashboard' },
  { label: 'Tenants', to: '/tenants', icon: 'tenants' },
  { label: 'Products', to: '/products', icon: 'products' },
  { label: 'Reservations', to: '/reservations', icon: 'reservations' },
  { label: 'Stock Movements', to: '/stock-movements', icon: 'reports' },
  { label: 'Reports', to: '/reports', icon: 'reports' },
]

function Navigation({ onNavigate }) {
  return (
    <nav aria-label="Primary navigation" className="mt-8 space-y-1.5">
      {navigation.map((item) => (
        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-blue-500/20 text-white ring-1 ring-inset ring-blue-400/30'
                : 'text-slate-300 hover:bg-white/10 hover:text-white'
            }`
          }
          end={item.to === '/'}
          key={item.to}
          onClick={onNavigate}
          to={item.to}
        >
          <Icon name={item.icon} size={19} />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-slate-950 px-5 py-7 lg:block">
        <p className="text-lg font-bold tracking-wide text-white">NEXUS INVENTORY</p>
        <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Inventory workspace</p>
        <Navigation />
        <p className="absolute bottom-7 left-5 text-xs text-slate-500">Milestone 0 · Live API</p>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-slate-950 px-4 text-white lg:hidden">
        <p className="font-bold tracking-wide">NEXUS INVENTORY</p>
        <button
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
          className="grid size-11 place-items-center rounded-lg hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          <Icon name={menuOpen ? 'close' : 'menu'} size={24} />
        </button>
      </header>

      {menuOpen ? (
        <div className="fixed inset-x-0 top-16 z-20 border-b border-slate-800 bg-slate-950 px-4 pb-5 lg:hidden">
          <Navigation onNavigate={() => setMenuOpen(false)} />
        </div>
      ) : null}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl space-y-7 px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
