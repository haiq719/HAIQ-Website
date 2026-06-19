import clsx from 'clsx'
import { Link } from 'react-router-dom'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  as = 'button',
  to,
  loading = false,
  ...props
}) {
  const isFullWidth = className?.includes('w-full')

  const base = clsx(
    isFullWidth ? 'flex' : 'inline-flex',
    'items-center justify-center gap-1.5 rounded-lg font-bold uppercase tracking-wide transition-all duration-200',
    'disabled:opacity-40 disabled:cursor-not-allowed',
    loading && 'cursor-wait'
  )

  const sizes = {
    sm: 'px-4 py-2 text-[10px]',
    md: 'px-6 py-3 text-[11px]',
    lg: 'px-8 py-4 text-[11px]',
  }

  const variants = {
    primary: 'bg-primary text-dark hover:bg-secondary active:scale-[0.98]',
    secondary: 'border border-primary text-primary hover:bg-primary/10 active:scale-[0.98]',
    ghost: 'text-primary hover:underline',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]',
    muted: 'border border-[#8C7355]/40 text-[#8C7355] hover:border-primary hover:text-primary',
  }

  const mergedClass = clsx(base, sizes[size], variants[variant], className)

  if (as === 'link' && to) {
    return (
      <Link to={to} className={mergedClass} {...props}>
        {children}
      </Link>
    )
  }

  return (
    <button className={mergedClass} {...props}>
      {loading ? <span className="opacity-70">Loading…</span> : children}
    </button>
  )
}
