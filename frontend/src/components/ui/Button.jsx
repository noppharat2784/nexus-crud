import { Icon } from './Icon.jsx'

const variants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600',
  secondary:
    'border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-slate-500',
  danger:
    'border border-red-200 bg-white text-red-600 hover:bg-red-50 focus-visible:outline-red-500',
  ghost: 'text-blue-700 hover:bg-blue-50 focus-visible:outline-blue-600',
}

export function Button({ children, icon, variant = 'primary', className = '', ...props }) {
  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      type="button"
      {...props}
    >
      {icon ? <Icon name={icon} size={17} /> : null}
      {children}
    </button>
  )
}
