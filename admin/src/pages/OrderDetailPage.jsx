// OrderDetailPage.jsx
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import adminApi from '../services/adminApi'
import { useEntrance } from '../lib/anim'
import {
  ArrowLeft, ClipboardList, Bike, CheckCircle2, XCircle, Clock, RotateCcw,
  MapPin, Package, Banknote, CreditCard, Gift, StickyNote, History,
  ChevronRight, AlertTriangle, Check,
} from 'lucide-react'

// ── Status model — aligned to the live 4-state order flow ─────────────────────
const STATUS_META = {
  pending:   { label: 'Order Received', Icon: ClipboardList, color: '#E8C88A', step: 0 },
  en_route:  { label: 'En Route',       Icon: Bike,          color: '#D4A574', step: 1 },
  delivered: { label: 'Delivered',      Icon: CheckCircle2,  color: '#4ade80', step: 2 },
  cancelled: { label: 'Cancelled',      Icon: XCircle,       color: '#f87171', step: -1 },
}
const FLOW = ['pending', 'en_route', 'delivered']
const STATUS_TRANSITIONS = {
  pending:   ['en_route', 'cancelled'],
  en_route:  ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

// ── Payment display — order.payment_status is the source of truth ─────────────
const PAYMENT_META = {
  paid:     { label: 'Paid',     color: '#4ade80', Icon: CheckCircle2 },
  pending:  { label: 'Pending',  color: '#E8C88A', Icon: Clock },
  unpaid:   { label: 'Unpaid',   color: '#E8C88A', Icon: Clock },
  failed:   { label: 'Failed',   color: '#f87171', Icon: XCircle },
  refunded: { label: 'Refunded', color: '#D4A574', Icon: RotateCcw },
}
const prettyMethod = m => ({
  cash_on_delivery: 'Cash on Delivery',
  mtn_momo:         'MTN Mobile Money',
  airtel:           'Airtel Money',
}[m] || (m || '—').replace(/_/g, ' '))

const fmt = n => Number(n || 0).toLocaleString()
const fmtDateTime = s => new Date(s).toLocaleString('en-UG', {
  day: 'numeric', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Kampala',
})

// ── Status progress stepper ───────────────────────────────────────────────────
function StatusStepper({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded"
        style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)' }}>
        <XCircle size={18} style={{ color: '#f87171', flexShrink: 0 }} />
        <p className="text-sm font-medium" style={{ color: '#f87171' }}>This order was cancelled.</p>
      </div>
    )
  }
  const currentStep = STATUS_META[status]?.step ?? 0
  return (
    <div className="flex items-center">
      {FLOW.map((s, i) => {
        const meta = STATUS_META[s]
        const done = currentStep > meta.step
        const now  = currentStep === meta.step
        const active = done || now
        return (
          <div key={s} className="flex items-center" style={{ flex: i < FLOW.length - 1 ? 1 : '0 0 auto' }}>
            <div className="flex flex-col items-center gap-1.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: active ? meta.color : 'rgba(61,32,0,0.6)',
                  color:      active ? '#1A0A00' : 'rgba(242,234,216,0.3)',
                  boxShadow:  now ? `0 0 0 4px ${meta.color}22` : 'none',
                }}>
                {done ? <Check size={16} strokeWidth={2.5} /> : <meta.Icon size={16} strokeWidth={1.75} />}
              </div>
              <span className="text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap"
                style={{ color: now ? meta.color : active ? '#8C7355' : 'rgba(140,115,85,0.5)' }}>
                {meta.label}
              </span>
            </div>
            {i < FLOW.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 mb-4 rounded transition-all"
                style={{ background: currentStep > meta.step ? meta.color : 'rgba(61,32,0,0.8)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Pill({ color, Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
      style={{ color, background: `${color}1A` }}>
      {Icon && <Icon size={12} strokeWidth={2} />}
      {children}
    </span>
  )
}

export default function OrderDetailPage() {
  const { id }        = useParams()
  const [order,      setOrder]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [newStatus,  setNewStatus]  = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [updating,   setUpdating]   = useState(false)
  const [error,      setError]      = useState(null)
  const [success,    setSuccess]    = useState(null)

  const containerRef = useEntrance([loading], { delay: 70 })

  const load = () => {
    setLoading(true)
    adminApi.get(`/admin/orders/${id}`)
      .then(res => { setOrder(res.data.order); setNewStatus('') })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const updateStatus = async () => {
    if (!newStatus) return
    setUpdating(true); setError(null); setSuccess(null)
    try {
      await adminApi.patch(`/admin/orders/${id}/status`, { status: newStatus, note: statusNote })
      setSuccess(`Status updated to "${STATUS_META[newStatus]?.label || newStatus}"`)
      setStatusNote('')
      load()
    } catch (err) {
      setError(err.response?.data?.error ?? 'Update failed')
    } finally { setUpdating(false) }
  }

  if (loading) return (
    <div className="space-y-4 max-w-4xl">
      <div className="h-8 w-48 skeleton rounded" style={{ background: '#3D2000' }} />
      <div className="h-28 skeleton rounded-lg" style={{ background: '#3D2000' }} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array(4).fill(null).map((_, i) => (
          <div key={i} className="h-40 skeleton rounded-lg" style={{ background: '#3D2000' }} />
        ))}
      </div>
    </div>
  )

  if (!order) return (
    <div className="text-center py-20" style={{ color: 'rgba(242,234,216,0.3)' }}>Order not found.</div>
  )

  const statusMeta  = STATUS_META[order.status] || STATUS_META.pending
  const allowed     = STATUS_TRANSITIONS[order.status] || []
  const isCOD       = order.payment_method === 'cash_on_delivery'

  // Authoritative payment status from the order itself
  const payMeta = PAYMENT_META[order.payment_status] || PAYMENT_META.unpaid

  return (
    <div ref={containerRef} className="space-y-6 max-w-4xl">

      {/* Back link */}
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
        style={{ color: '#8C7355', textDecoration: 'none' }}>
        <ArrowLeft size={14} /> Back to Orders
      </Link>

      {/* Header card */}
      <div className="admin-card">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-2 flex-wrap">
              <p className="font-mono font-bold text-sm" style={{ color: '#E8C88A' }}>{order.order_number}</p>
              <Pill color={statusMeta.color} Icon={statusMeta.Icon}>{statusMeta.label}</Pill>
              <Pill color={payMeta.color} Icon={payMeta.Icon}>{payMeta.label}</Pill>
            </div>
            <h1 className="font-serif font-bold text-2xl" style={{ color: '#F2EAD8' }}>
              {order.first_name} {order.last_name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(242,234,216,0.4)' }}>
              {order.email} · {order.phone}
            </p>
            <p className="text-xs mt-1" style={{ color: '#8C7355' }}>Placed {fmtDateTime(order.created_at)}</p>
          </div>
          <div className="text-right">
            <p className="font-serif font-bold text-2xl" style={{ color: '#E8C88A' }}>UGX {fmt(order.total)}</p>
            <p className="text-xs mt-0.5" style={{ color: '#8C7355' }}>{prettyMethod(order.payment_method)}</p>
          </div>
        </div>

        {/* Progress stepper */}
        <div className="mt-6 pt-5" style={{ borderTop: '1px solid #3D2000' }}>
          <StatusStepper status={order.status} />
        </div>
      </div>

      {error   && (
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)', color: '#f87171' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-sm px-4 py-3 rounded"
          style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80' }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Items */}
        <div className="admin-card">
          <div className="flex items-center gap-2 mb-4">
            <Package size={15} style={{ color: '#B8752A' }} />
            <h2 className="font-serif font-bold" style={{ color: '#F2EAD8' }}>Items</h2>
          </div>
          <div className="space-y-3">
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="font-medium" style={{ color: '#F2EAD8' }}>{item.product_name}</p>
                  <p className="text-xs" style={{ color: 'rgba(242,234,216,0.3)' }}>
                    {item.variant_label ? `${item.variant_label} × ` : '× '}{item.quantity}
                  </p>
                </div>
                <p className="font-bold" style={{ color: '#B8752A' }}>UGX {fmt(item.line_total)}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 space-y-1.5 text-sm" style={{ borderTop: '1px solid #3D2000' }}>
            <div className="flex justify-between" style={{ color: 'rgba(242,234,216,0.5)' }}>
              <span>Subtotal</span><span>UGX {fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between" style={{ color: 'rgba(242,234,216,0.5)' }}>
              <span>Delivery</span><span>UGX {fmt(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-bold mt-2 pt-2" style={{ color: '#F2EAD8', borderTop: '1px solid #3D2000' }}>
              <span>Total</span><span style={{ color: '#E8C88A' }}>UGX {fmt(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="admin-card">
          <div className="flex items-center gap-2 mb-4">
            <MapPin size={15} style={{ color: '#B8752A' }} />
            <h2 className="font-serif font-bold" style={{ color: '#F2EAD8' }}>Delivery</h2>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(242,234,216,0.6)' }}>{order.delivery_address}</p>
          {order.delivery_note && (
            <div className="flex items-start gap-2 mt-3 text-xs" style={{ color: 'rgba(242,234,216,0.4)' }}>
              <StickyNote size={13} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{order.delivery_note}</span>
            </div>
          )}
          {order.gift_note && (
            <div className="mt-4 p-3 rounded" style={{ background: 'rgba(184,117,42,0.1)', border: '1px solid rgba(184,117,42,0.2)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Gift size={12} style={{ color: '#B8752A' }} />
                <p className="text-[10px] uppercase tracking-wider" style={{ color: '#B8752A' }}>Gift Note</p>
              </div>
              <p className="text-sm italic" style={{ color: 'rgba(242,234,216,0.7)' }}>"{order.gift_note}"</p>
            </div>
          )}
        </div>

        {/* Status update */}
        <div className="admin-card">
          <div className="flex items-center gap-2 mb-4">
            <statusMeta.Icon size={15} style={{ color: '#B8752A' }} />
            <h2 className="font-serif font-bold" style={{ color: '#F2EAD8' }}>Update Status</h2>
          </div>
          <div className="flex items-center gap-2 mb-4 text-xs">
            <span style={{ color: '#8C7355' }}>Current:</span>
            <Pill color={statusMeta.color} Icon={statusMeta.Icon}>{statusMeta.label}</Pill>
          </div>
          {allowed.length === 0 ? (
            <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded"
              style={{ background: '#1A0A00', color: 'rgba(242,234,216,0.4)' }}>
              <CheckCircle2 size={14} style={{ color: order.status === 'delivered' ? '#4ade80' : '#8C7355' }} />
              No further transitions available.
            </div>
          ) : (
            <div className="space-y-3">
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="admin-input">
                <option value="">Select new status…</option>
                {allowed.map(s => (
                  <option key={s} value={s}>{STATUS_META[s]?.label || s}</option>
                ))}
              </select>
              <textarea value={statusNote} onChange={e => setStatusNote(e.target.value)}
                placeholder="Internal note (optional)" rows={2} className="admin-input resize-none" />
              <button onClick={updateStatus} disabled={!newStatus || updating}
                className="admin-btn-primary w-full py-2.5 flex items-center justify-center gap-2 disabled:opacity-40">
                {updating ? 'Updating…' : <>Update Status <ChevronRight size={15} /></>}
              </button>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="admin-card">
          <div className="flex items-center gap-2 mb-4">
            {isCOD ? <Banknote size={15} style={{ color: '#B8752A' }} /> : <CreditCard size={15} style={{ color: '#B8752A' }} />}
            <h2 className="font-serif font-bold" style={{ color: '#F2EAD8' }}>Payment</h2>
          </div>

          {/* Authoritative status block */}
          <div className="flex items-center justify-between p-3 rounded mb-3"
            style={{ background: '#1A0A00', border: `1px solid ${payMeta.color}33` }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#F2EAD8' }}>{prettyMethod(order.payment_method)}</p>
              <p className="text-xs mt-0.5" style={{ color: '#8C7355' }}>UGX {fmt(order.total)}</p>
            </div>
            <Pill color={payMeta.color} Icon={payMeta.Icon}>{payMeta.label}</Pill>
          </div>

          {isCOD && order.payment_status !== 'paid' && order.status !== 'cancelled' && (
            <p className="text-[11px] leading-relaxed" style={{ color: '#8C7355' }}>
              Cash is collected on delivery. Marking this order <span style={{ color: '#4ade80' }}>Delivered</span> will
              automatically record it as <span style={{ color: '#4ade80' }}>Paid</span>.
            </p>
          )}

          {/* Transaction records, if any */}
          {order.payments?.length > 0 && (
            <div className="mt-3 space-y-2">
              {order.payments.map(p => {
                // Reconcile against the order's authoritative status for display
                const recPaid = order.payment_status === 'paid' || p.status === 'successful'
                const recColor = recPaid ? '#4ade80' : p.status === 'failed' ? '#f87171' : '#E8C88A'
                const recLabel = recPaid ? 'Successful' : p.status
                return (
                  <div key={p.id} className="flex items-center justify-between text-xs px-3 py-2 rounded"
                    style={{ background: '#1A0A00' }}>
                    <span className="capitalize" style={{ color: 'rgba(242,234,216,0.5)' }}>
                      {prettyMethod(p.payment_method)}
                      {p.provider_ref && <span className="font-mono ml-2" style={{ color: '#8C7355' }}>{p.provider_ref}</span>}
                    </span>
                    <span className="font-bold capitalize" style={{ color: recColor }}>{recLabel}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Event timeline */}
      {order.events?.length > 0 && (
        <div className="admin-card">
          <div className="flex items-center gap-2 mb-4">
            <History size={15} style={{ color: '#B8752A' }} />
            <h2 className="font-serif font-bold" style={{ color: '#F2EAD8' }}>Event Timeline</h2>
          </div>
          <div className="space-y-3">
            {order.events.map(ev => (
              <div key={ev.id} className="flex items-start gap-3 text-xs">
                <span className="flex-shrink-0 mt-0.5 tabular-nums" style={{ color: 'rgba(184,117,42,0.4)' }}>
                  {fmtDateTime(ev.created_at)}
                </span>
                <span style={{ color: 'rgba(242,234,216,0.5)' }} className="capitalize">
                  {ev.event_type.replace(/_/g, ' ')}
                  {ev.old_value && ev.new_value && (
                    <> · <span style={{ color: 'rgba(242,234,216,0.3)' }}>{(STATUS_META[ev.old_value]?.label) || ev.old_value}</span>
                      {' → '}<span style={{ color: '#B8752A' }}>{(STATUS_META[ev.new_value]?.label) || ev.new_value}</span></>
                  )}
                  {ev.note && <> · <span className="italic" style={{ color: 'rgba(242,234,216,0.3)' }}>"{ev.note}"</span></>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
