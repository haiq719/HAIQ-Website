import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import adminApi from '../services/adminApi'
import Button from '../components/shared/Button'
import StatusBadge from '../components/shared/StatusBadge'
import { PageShell, PageHeader, Card, SectionHeader, EmptyState } from '../components/shared/ui'
import { usePop } from '../lib/anim'
import {
  ShoppingBag, Search, X, ChevronLeft, ChevronRight, AlertTriangle,
  SlidersHorizontal, ChevronRight as Arrow, Inbox,
} from 'lucide-react'

const ORDER_STATUSES = ['pending', 'en_route', 'delivered', 'cancelled']
const STATUS_NEXT = {
  pending:   ['en_route', 'cancelled'],
  en_route:  ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
}

const CANCEL_REASONS = [
  'Customer unreachable after multiple attempts',
  'Delivery address incomplete or incorrect',
  'Item out of stock',
  'Order placed by mistake (customer request)',
  'Suspected fraudulent order',
  'Kitchen capacity — unable to fulfil today',
  'Other',
]

const fmt = n => Number(n || 0).toLocaleString()

// ── Cancel modal ──────────────────────────────────────────────────────────────
function CancelModal({ order, onClose, onDone }) {
  const [selected,  setSelected]  = useState('')
  const [custom,    setCustom]    = useState('')
  const [submitting,setSubmitting]= useState(false)
  const [err,       setErr]       = useState(null)
  const popRef = usePop()

  const reason = selected === 'Other' ? custom.trim() : selected

  const submit = async () => {
    if (!selected)                              { setErr('Please select a reason.'); return }
    if (selected === 'Other' && !custom.trim()) { setErr('Please describe the reason.'); return }
    setSubmitting(true); setErr(null)
    try {
      await adminApi.post(`/admin/orders/${order.id}/cancel`, { reason })
      onDone(); onClose()
    } catch (e) { setErr(e.response?.data?.error || 'Failed.') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div ref={popRef} className="w-full max-w-sm rounded-xl overflow-hidden"
        style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.3)' }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid #3D2000' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} style={{ color: '#f87171' }} />
            <h3 className="font-serif font-bold text-sm" style={{ color: '#F2EAD8' }}>Cancel Order</h3>
          </div>
          <button onClick={onClose} className="hover:opacity-60 transition" style={{ color: '#8C7355' }}>
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-5 space-y-4">
          <div className="px-3 py-2.5 rounded-lg" style={{ background: '#1A0A00', border: '1px solid #3D2000' }}>
            <p className="text-[10px]" style={{ color: '#8C7355' }}>Order</p>
            <p className="font-mono font-bold text-sm" style={{ color: '#E8C88A' }}>{order.order_number}</p>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: '#8C7355' }}>
              Reason for Cancellation *
            </label>
            <select value={selected} onChange={e => setSelected(e.target.value)} className="admin-input"
              style={{ color: selected ? '#F2EAD8' : '#8C7355' }}>
              <option value="" disabled>Select a reason...</option>
              {CANCEL_REASONS.map(r => <option key={r} value={r} style={{ background: '#1A0A00', color: '#F2EAD8' }}>{r}</option>)}
            </select>
          </div>

          {selected === 'Other' && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>
                Tell the customer why *
              </label>
              <textarea rows={3} value={custom} onChange={e => setCustom(e.target.value)}
                placeholder="Explain the reason in plain terms..." className="admin-input resize-none" />
            </div>
          )}

          {err && <p className="text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertTriangle size={13} /> {err}</p>}
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <Button onClick={onClose} variant="muted" size="sm" className="flex-1">Keep Order</Button>
          <Button onClick={submit} disabled={submitting} loading={submitting} variant="danger" size="sm" className="flex-1">
            Cancel Order
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [total,        setTotal]        = useState(0)
  const [page,         setPage]         = useState(1)
  const [search,       setSearch]       = useState('')
  const [statusF,      setStatusF]      = useState('')
  const [payF,         setPayF]         = useState('')
  const [cancelModal,  setCancelModal]  = useState(null)
  const [updatingId,   setUpdatingId]   = useState(null)

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 20 })
    if (search)  params.set('search', search)
    if (statusF) params.set('status', statusF)
    if (payF)    params.set('payment_status', payF)
    adminApi.get(`/admin/orders?${params}`)
      .then(r => { setOrders(r.data.orders || []); setTotal(r.data.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, statusF, payF])

  const handleSearch = (e) => { e.preventDefault(); setPage(1); load() }

  const updateStatus = async (orderId, newStatus) => {
    if (newStatus === 'cancelled') { setCancelModal(orders.find(o => o.id === orderId)); return }
    setUpdatingId(orderId)
    try {
      await adminApi.patch(`/admin/orders/${orderId}/status`, { status: newStatus })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Status update failed.')
    } finally { setUpdatingId(null) }
  }

  const totalPages = Math.ceil(total / 20)

  return (
    <PageShell deps={[loading]}>
      <PageHeader label="Operations" title="Orders" icon={ShoppingBag} />

      {/* Filters */}
      <Card>
        <SectionHeader icon={SlidersHorizontal} title="Search & Filter" right={
          <span className="text-[10px]" style={{ color: '#8C7355' }}>{fmt(total)} order{total !== 1 ? 's' : ''}</span>
        } />

        <form onSubmit={handleSearch} className="flex flex-wrap gap-2 mb-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8C7355' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search name, email or order number…"
              className="admin-input" style={{ paddingLeft: '2.1rem' }} />
          </div>
          <Button type="submit" variant="primary" size="sm">Search</Button>
          {(search || statusF || payF) && (
            <Button type="button" variant="muted" size="sm"
              onClick={() => { setSearch(''); setStatusF(''); setPayF(''); setPage(1); setTimeout(load, 0) }}>
              Clear
            </Button>
          )}
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-semibold mb-1" style={{ color: '#8C7355' }}>Order Status</label>
            <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1) }} className="admin-input">
              <option value="">All Statuses</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s} style={{ background: '#1A0A00' }}>{s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] uppercase tracking-widest font-semibold mb-1" style={{ color: '#8C7355' }}>Payment Status</label>
            <select value={payF} onChange={e => { setPayF(e.target.value); setPage(1) }} className="admin-input">
              <option value="">All Payments</option>
              {['unpaid','pending','paid','failed','refunded'].map(s => <option key={s} value={s} style={{ background: '#1A0A00' }}>{s}</option>)}
            </select>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto admin-scroll">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ borderBottom: '1px solid #3D2000' }}>
                {['Order','Customer','Total','Payment','Status','Update','',].map((h, i) => (
                  <th key={i} className="px-3 md:px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: '#8C7355' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array(6).fill(null).map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}>
                      {Array(7).fill(null).map((__, j) => (
                        <td key={j} className="px-4 py-4"><div className="h-2.5 rounded skeleton" style={{ background: '#3D2000', width: '75%' }} /></td>
                      ))}
                    </tr>
                  ))
                : orders.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={Inbox} title="No orders found" sub="Try adjusting your search or filters." /></td></tr>
                ) : orders.map(o => {
                    const next = STATUS_NEXT[o.status] || []
                    const isUpdating = updatingId === o.id
                    return (
                      <tr key={o.id} className="transition-colors" style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,117,42,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td className="px-3 md:px-4 py-3">
                          <button className="font-mono text-[10px] font-bold hover:underline" style={{ color: '#E8C88A' }}
                            onClick={() => navigate(`/orders/${o.id}`)}>{o.order_number}</button>
                          <p className="text-[10px]" style={{ color: '#8C7355' }}>
                            {new Date(o.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short' })}
                          </p>
                        </td>
                        <td className="px-3 md:px-4 py-3">
                          <p className="text-xs font-medium" style={{ color: '#F2EAD8' }}>{o.first_name} {o.last_name}</p>
                          <p className="text-[10px] truncate max-w-[120px]" style={{ color: '#8C7355' }}>{o.email}</p>
                        </td>
                        <td className="px-3 md:px-4 py-3 text-xs font-medium tabular-nums" style={{ color: '#F2EAD8' }}>UGX {fmt(o.total)}</td>
                        <td className="px-3 md:px-4 py-3"><StatusBadge status={o.payment_status} /></td>
                        <td className="px-3 md:px-4 py-3">
                          <StatusBadge status={o.status} />
                          {o.status === 'cancelled' && o.cancellation_reason && (
                            <p className="text-[9px] mt-1 italic max-w-[140px]" style={{ color: '#8C7355' }}>
                              {o.cancelled_by === 'admin' ? 'Admin: ' : 'Customer: '}{o.cancellation_reason}
                            </p>
                          )}
                        </td>
                        <td className="px-3 md:px-4 py-3">
                          {next.length > 0 ? (
                            <select disabled={isUpdating} defaultValue=""
                              onChange={e => { if (e.target.value) updateStatus(o.id, e.target.value) }}
                              className="admin-input" style={{ fontSize: '11px', padding: '5px 1.8rem 5px 8px', color: '#B8752A', width: 'auto', minWidth: '120px' }}>
                              <option value="" disabled>{isUpdating ? 'Updating…' : 'Move to…'}</option>
                              {next.map(s => (
                                <option key={s} value={s} style={{ background: '#1A0A00', color: s === 'cancelled' ? '#f87171' : '#F2EAD8' }}>
                                  {s === 'cancelled' ? 'Cancel order' : s.replace(/_/g, ' ')}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-[10px]" style={{ color: '#8C7355' }}>
                              {o.status === 'delivered' ? 'Complete' : o.status === 'cancelled' ? 'Cancelled' : '—'}
                            </span>
                          )}
                        </td>
                        <td className="px-3 md:px-4 py-3">
                          <button onClick={() => navigate(`/orders/${o.id}`)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold hover:gap-1.5 transition-all" style={{ color: '#B8752A' }}>
                            View <Arrow size={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #3D2000' }}>
            <Button disabled={page === 1} onClick={() => setPage(p => p - 1)} variant="secondary" size="sm">
              <ChevronLeft size={14} /> Previous
            </Button>
            <p className="text-xs" style={{ color: '#8C7355' }}>Page {page} of {totalPages}</p>
            <Button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} variant="secondary" size="sm">
              Next <ChevronRight size={14} />
            </Button>
          </div>
        )}
      </Card>

      {cancelModal && (
        <CancelModal order={cancelModal} onClose={() => setCancelModal(null)} onDone={() => { setCancelModal(null); load() }} />
      )}
    </PageShell>
  )
}
