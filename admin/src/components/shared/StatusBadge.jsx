// admin/src/components/shared/StatusBadge.jsx
// One pill style for both order + payment statuses, matching the Order Detail page.
import {
  ClipboardList, Bike, CheckCircle2, XCircle, Clock, RotateCcw, Truck,
} from 'lucide-react'

const CONFIGS = {
  // ── Order statuses (live 4-state flow + legacy fallbacks) ──
  pending:         { label: 'Pending',     color: '#E8C88A', Icon: ClipboardList },
  freshly_kneaded: { label: 'In Progress', color: '#D4A574', Icon: Bike },
  ovenbound:       { label: 'In Progress', color: '#D4A574', Icon: Bike },
  on_the_cart:     { label: 'In Progress', color: '#D4A574', Icon: Bike },
  en_route:        { label: 'En Route',    color: '#D4A574', Icon: Bike },
  delivered:       { label: 'Delivered',   color: '#4ade80', Icon: CheckCircle2 },
  cancelled:       { label: 'Cancelled',   color: '#f87171', Icon: XCircle },

  // ── Review / moderation statuses ──
  approved:        { label: 'Approved',    color: '#4ade80', Icon: CheckCircle2 },
  rejected:        { label: 'Rejected',    color: '#f87171', Icon: XCircle },

  // ── Loyalty card statuses ──
  dispatched:      { label: 'Dispatched',  color: '#60a5fa', Icon: Truck },

  // ── Payment statuses ──
  paid:            { label: 'Paid',        color: '#4ade80', Icon: CheckCircle2 },
  successful:      { label: 'Successful',  color: '#4ade80', Icon: CheckCircle2 },
  unpaid:          { label: 'Unpaid',      color: '#E8C88A', Icon: Clock },
  initiated:       { label: 'Initiated',   color: '#E8C88A', Icon: Clock },
  failed:          { label: 'Failed',      color: '#f87171', Icon: XCircle },
  refunded:        { label: 'Refunded',    color: '#D4A574', Icon: RotateCcw },
}

export default function StatusBadge({ status, showIcon = true }) {
  const cfg = CONFIGS[status] ?? {
    label: (status || '—').replace(/_/g, ' '),
    color: '#8C7355',
    Icon: ClipboardList,
  }
  const { label, color, Icon } = cfg
  return (
    <span className="admin-pill" style={{ color, background: `${color}1A` }}>
      {showIcon && <Icon size={12} strokeWidth={2} />}
      {label}
    </span>
  )
}
