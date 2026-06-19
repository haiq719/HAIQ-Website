// admin/src/components/shared/ui.jsx
// Shared visual primitives — one consistent design language across the admin,
// matching the Order Detail page (cards, gold/amber accents, Lucide icons).
import { useEntrance } from '../../lib/anim'

const C = {
  gold:   '#E8C88A',
  amber:  '#B8752A',
  tan:    '#D4A574',
  cream:  '#F2EAD8',
  muted:  '#8C7355',
  ink:    '#1A0A00',
  border: '#3D2000',
}

/** Page-level header: small uppercase label + serif title, optional actions. */
export function PageHeader({ label = 'Admin', title, icon: Icon, actions }) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(184,117,42,0.12)', border: '1px solid rgba(184,117,42,0.25)' }}>
            <Icon size={18} strokeWidth={1.75} style={{ color: C.amber }} />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-0.5" style={{ color: C.amber }}>
            {label}
          </p>
          <h1 className="font-serif font-bold text-2xl md:text-3xl leading-none truncate" style={{ color: C.cream }}>
            {title}
          </h1>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
    </div>
  )
}

/** Card panel — the core surface used everywhere. */
export function Card({ children, className = '', hover = false, style = {}, ...props }) {
  return (
    <div className={`admin-card ${hover ? 'admin-card-hover' : ''} ${className}`} style={style} {...props}>
      {children}
    </div>
  )
}

/** In-card section header: icon + serif title (+ optional right slot). */
export function SectionHeader({ icon: Icon, title, right }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 min-w-0">
        {Icon && <Icon size={15} strokeWidth={1.75} style={{ color: C.amber, flexShrink: 0 }} />}
        <h2 className="font-serif font-bold truncate" style={{ color: C.cream }}>{title}</h2>
      </div>
      {right}
    </div>
  )
}

/** Status / payment pill. Pass a color and optional Lucide icon. */
export function Pill({ color = C.muted, icon: Icon, children, className = '' }) {
  return (
    <span className={`admin-pill ${className}`} style={{ color, background: `${color}1A` }}>
      {Icon && <Icon size={12} strokeWidth={2} />}
      {children}
    </span>
  )
}

/** Empty / zero-state block. */
export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {Icon && (
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
          style={{ background: 'rgba(140,115,85,0.1)' }}>
          <Icon size={22} strokeWidth={1.5} style={{ color: 'rgba(140,115,85,0.7)' }} />
        </div>
      )}
      <p className="font-serif font-bold text-lg" style={{ color: C.cream }}>{title}</p>
      {sub && <p className="text-sm mt-1 max-w-xs" style={{ color: C.muted }}>{sub}</p>}
    </div>
  )
}

/** Loading skeleton block. */
export function Skeleton({ className = '', style = {} }) {
  return <div className={`skeleton rounded ${className}`} style={{ background: C.border, ...style }} />
}

/** Page wrapper that runs a staggered entrance on its direct children. */
export function PageShell({ children, deps = [], className = '', max = '1300px' }) {
  const ref = useEntrance(deps, { delay: 65, y: 18 })
  return (
    <div ref={ref} className={`space-y-6 ${className}`} style={{ maxWidth: max }}>
      {children}
    </div>
  )
}

export const ADMIN_COLORS = C
