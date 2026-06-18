import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Crown from '../components/shared/Crown'
import Button from '../components/shared/Button'
import { ClipboardList, ChefHat, Flame, Package, Bike, Sparkles, XCircle, AlertTriangle } from 'lucide-react'

const STATUS_CONFIG = {
  pending:         { label: 'Order Received',  icon: ClipboardList, step: 1, desc: 'We have your order and are getting started.' },
  freshly_kneaded: { label: 'Freshly Kneaded', icon: ChefHat,       step: 2, desc: 'Our bakers are working on your cookies right now.' },
  ovenbound:       { label: 'In the Oven',     icon: Flame,         step: 3, desc: 'Your cookies are baking. The good part.' },
  on_the_cart:     { label: 'Packed & Ready',  icon: Package,       step: 4, desc: 'Packaged and waiting for pickup.' },
  en_route:        { label: 'En Route',        icon: Bike,          step: 5, desc: 'On the way to you. Stay close.' },
  delivered:       { label: 'Delivered.',      icon: Sparkles,      step: 6, desc: 'Enjoy every bite.' },
  cancelled:       { label: 'Cancelled',       icon: XCircle,       step: 0, desc: 'This order was cancelled.' },
}

const ACTIVE_STATUSES  = ['pending','freshly_kneaded','ovenbound','on_the_cart','en_route']
const PAST_STATUSES    = ['delivered','cancelled']
const containsHtml = (value = '') => /<[^>]*>/.test(value) || /javascript:/i.test(value)

// ── Progress bar ──────────────────────────────────────────────────────────────
function OrderProgress({ status }) {
  const steps = ['pending','freshly_kneaded','ovenbound','on_the_cart','en_route','delivered']
  const current = STATUS_CONFIG[status]
  if (!current || status === 'cancelled') return (
    <div className="px-4 py-3 text-center text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
      This order was cancelled.
    </div>
  )

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-4">
        {steps.map((s, i) => {
          const cfg  = STATUS_CONFIG[s]
          const done = current.step > cfg.step
          const now  = status === s
          return (
            <div key={s} className="flex flex-col items-center flex-1">
              {/* Connector */}
              {i > 0 && (
                <div className="absolute" style={{ display: 'none' }} />
              )}
              <div
                className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: done || now ? '#B8752A' : 'rgba(61,32,0,0.6)',
                  border:     now ? '2px solid #E8C88A' : '2px solid transparent',
                  boxShadow:  now ? '0 0 16px rgba(184,117,42,0.4)' : 'none',
                  color:      done || now ? '#1A0A00' : 'rgba(242,234,216,0.3)',
                }}
              >
                <cfg.icon size={14} />
              </div>
              <p className="text-[8px] md:text-[10px] mt-1 text-center leading-tight hidden sm:block"
                style={{ color: now ? '#B8752A' : 'rgba(242,234,216,0.3)' }}>
                {cfg.label.split(' ')[0]}
              </p>
            </div>
          )
        })}
      </div>
      {/* Connecting line */}
      <div className="relative mt-[-60px] mb-6 hidden sm:block">
        <div className="absolute top-4 left-4 right-4 h-0.5" style={{ background: 'rgba(184,117,42,0.15)' }}>
          <div
            className="h-full transition-all duration-700"
            style={{
              width:      `${Math.max(0, ((current.step - 1) / 5) * 100)}%`,
              background: '#B8752A',
            }}
          />
        </div>
      </div>

      <div className="mt-2 text-center">
        <p className="font-serif font-bold text-xl" style={{ color: '#F2EAD8' }}>{current.label}</p>
        <p className="text-sm mt-1" style={{ color: 'rgba(242,234,216,0.5)' }}>{current.desc}</p>
      </div>
    </div>
  )
}

// ── Cancel modal ──────────────────────────────────────────────────────────────
function CancelModal({ order, onCancel, onClose }) {
  const [reason,     setReason]     = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)

  const handleCancel = async () => {
    if (containsHtml(reason)) { setError('Please remove HTML or script content.'); return }
    if (reason.trim().length < 5) { setError('Please give a reason (at least 5 characters).'); return }
    setSubmitting(true)
    try {
      await api.post(`/orders/${order.id}/cancel`, { reason: reason.trim() })
      onCancel()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel. Please contact us.')
    } finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(26,10,0,0.85)' }}>
      <div className="w-full max-w-sm p-6" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.3)' }}>
        <h3 className="font-serif font-bold text-lg mb-1" style={{ color: '#F2EAD8' }}>Cancel Order</h3>
        <p className="text-sm mb-4" style={{ color: '#8C7355' }}>{order.order_number}</p>

        <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: '#8C7355' }}>
          Reason for cancellation *
        </label>
        <textarea
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Please tell us why you're cancelling..."
          className="w-full px-3 py-2.5 text-sm resize-none focus:outline-none"
          style={{ background: '#1A0A00', border: '1px solid #3D2000', color: '#F2EAD8' }}
        />

        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

        <div className="flex gap-3 mt-4">
          <Button onClick={onClose} variant="secondary" className="flex-1" size="sm">
            Keep Order
          </Button>
          <Button onClick={handleCancel} disabled={submitting} loading={submitting} variant="danger" className="flex-1" size="sm">
            Cancel Order
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Order detail view ─────────────────────────────────────────────────────────
function OrderDetail({ order, onBack, onCancelled }) {
  const [messages,  setMessages]  = useState([])
  const [msgBody,   setMsgBody]   = useState('')
  const [sending,   setSending]   = useState(false)
  const [msgError,  setMsgError]  = useState(null)
  const [showCancel,setShowCancel]= useState(false)

  const canCancel = ACTIVE_STATUSES.includes(order.status) && order.status !== 'en_route'
  const isDelivered = order.status === 'delivered'

  useEffect(() => {
    api.get(`/messages/${order.id}`)
      .then(res => setMessages(res.data.messages || []))
      .catch(() => {})
  }, [order.id])

  const sendMessage = async () => {
    if (!msgBody.trim() || containsHtml(msgBody)) return
    setSending(true)
    setMsgError(null)
    try {
      await api.post('/messages', { order_id: order.id, body: msgBody.trim() })
      setMsgBody('')
      const res = await api.get(`/messages/${order.id}`)
      setMessages(res.data.messages || [])
    } catch (err) {
      setMsgError(err.message || 'Failed to send message. Try again.')
    } finally { setSending(false) }
  }

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 mb-6 text-sm hover:opacity-70 transition"
        style={{ color: '#8C7355' }}>
        ← All Orders
      </button>

      {/* Order header */}
      <div className="p-5 mb-5" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
        <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
          <div>
            <p className="font-mono font-bold text-lg" style={{ color: '#E8C88A' }}>{order.order_number}</p>
            <p className="text-xs mt-1" style={{ color: '#8C7355' }}>
              {new Date(order.created_at).toLocaleDateString('en-UG', { day:'numeric', month:'long', year:'numeric' })}
            </p>
          </div>
          <p className="font-bold text-lg" style={{ color: '#F2EAD8' }}>
            UGX {Number(order.total).toLocaleString()}
          </p>
        </div>

        <OrderProgress status={order.status} />

        {/* Delivery address */}
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid rgba(184,117,42,0.15)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1" style={{ color: '#8C7355' }}>
            Delivering to
          </p>
          <p className="text-sm" style={{ color: 'rgba(242,234,216,0.6)' }}>{order.delivery_address}</p>
        </div>
      </div>

      {/* Items */}
      {order.items?.length > 0 && (
        <div className="p-5 mb-5" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-3" style={{ color: '#8C7355' }}>Items</p>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between mb-2 text-sm">
              <span style={{ color: 'rgba(242,234,216,0.7)' }}>{item.quantity}× {item.product_name}</span>
              <span style={{ color: '#B8752A' }}>UGX {Number(item.line_total).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Message thread */}
      {!isDelivered && (
        <div className="p-5 mb-5" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: '#8C7355' }}>
            Message HAIQ About This Order
          </p>
          <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.sender_type === 'admin' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className="px-3 py-2 text-xs max-w-[80%] leading-relaxed"
                  style={{
                    background: m.sender_type === 'admin' ? 'rgba(184,117,42,0.15)' : '#1A0A00',
                    border:     `1px solid ${m.sender_type === 'admin' ? 'rgba(184,117,42,0.3)' : 'rgba(61,32,0,0.8)'}`,
                    color:      '#F2EAD8',
                  }}
                >
                  {m.body}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-xs text-center py-3" style={{ color: '#8C7355' }}>No messages yet.</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={msgBody}
              onChange={e => setMsgBody(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Ask us about your order…"
              className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
              style={{ background: '#1A0A00', border: '1px solid #3D2000', color: '#F2EAD8' }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !msgBody.trim()}
              className="px-4 py-2 font-bold text-[11px] tracking-wider uppercase disabled:opacity-40"
              style={{ background: '#B8752A', color: '#1A0A00' }}
            >
              {sending ? '…' : 'Send'}
            </button>
          </div>
          {msgError && (
            <p className="text-xs mt-2" style={{ color: '#f87171' }}>{msgError}</p>
          )}
        </div>
      )}

      {/* Cancel button */}
      {canCancel && (
        <button
          onClick={() => setShowCancel(true)}
          className="w-full py-3 text-sm font-semibold transition hover:opacity-70"
          style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#f87171' }}
        >
          Cancel This Order
        </button>
      )}

      {showCancel && (
        <CancelModal
          order={order}
          onCancel={onCancelled}
          onClose={() => setShowCancel(false)}
        />
      )}
    </div>
  )
}

// ── Main Track Page ───────────────────────────────────────────────────────────
export default function TrackOrderPage() {
  const { token }   = useParams()
  const { user }    = useAuth()
  const navigate    = useNavigate()

  const [orders,    setOrders]    = useState([])
  const [selected,  setSelected]  = useState(null)
  const [tab,       setTab]       = useState('active')  // 'active' | 'past'
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)

  const loadOrders = () => {
    if (!user) { setLoading(false); return }
    setError(null)
    api.get('/orders/my?limit=50')
      .then(res => setOrders(res.data.orders || []))
      .catch(err => setError(err.message || 'Failed to load orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadOrders() }, [user])

  // If a tracking token is in the URL, find and open that order
  useEffect(() => {
    if (token && orders.length > 0) {
      const found = orders.find(o => o.tracking_token === token)
      if (found) { setSelected(found); return }
      // Try fetching by token directly if not in my orders
      api.get(`/orders/track/${token}`)
        .then(res => { if (res.data.order) setSelected(res.data.order) })
        .catch(() => {})
    }
  }, [token, orders])

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status))
  const pastOrders   = orders.filter(o => PAST_STATUSES.includes(o.status))
  const displayList  = tab === 'active' ? activeOrders : pastOrders

  // Get full order detail when selected
  const [orderDetail, setOrderDetail] = useState(null)
  useEffect(() => {
    if (!selected) { setOrderDetail(null); return }
    api.get(`/orders/${selected.id}`)
      .then(res => setOrderDetail(res.data.order || res.data))
      .catch(() => setOrderDetail(selected))
  }, [selected])

  if (!user) return (
    <div style={{ background: '#0E0600', minHeight: '100vh' }} className="flex items-center justify-center px-6">
      <div className="text-center max-w-xs">
        <Crown size={24} color="#B8752A" className="mx-auto mb-5 opacity-50" />
        <p className="font-serif font-bold text-2xl mb-2" style={{ color: '#F2EAD8' }}>Sign in to track orders</p>
        <p className="text-sm mb-6" style={{ color: '#8C7355' }}>Your orders are linked to your account.</p>
        <Link to="/login" className="inline-block font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-3"
          style={{ background: '#B8752A', color: '#1A0A00' }}>
          Sign In
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ background: '#0E0600', minHeight: '100vh' }}>

      {/* Header */}
      <div className="border-b py-14 md:py-20 px-6 md:px-16" style={{ borderColor: 'rgba(184,117,42,0.2)' }}>
        <Crown size={20} color="#B8752A" className="mb-4 opacity-65" />
        <h1 className="font-serif font-bold mb-2"
          style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: '#F2EAD8' }}>
          Your Orders.
        </h1>
        <div className="w-10 h-px" style={{ background: '#B8752A' }} />
      </div>

      <div className="px-6 md:px-16 py-8 max-w-2xl">

        {/* If showing order detail */}
        {selected && orderDetail ? (
          <OrderDetail
            order={orderDetail}
            onBack={() => { setSelected(null); setOrderDetail(null); navigate('/track') }}
            onCancelled={() => { setSelected(null); setOrderDetail(null); loadOrders() }}
          />
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-1 p-1 mb-6 w-fit" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
              {[
                { key: 'active', label: `Active (${activeOrders.length})` },
                { key: 'past',   label: `Past (${pastOrders.length})`   },
              ].map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="px-4 py-2 text-sm font-semibold transition"
                  style={{
                    background: tab === t.key ? '#B8752A' : 'transparent',
                    color:      tab === t.key ? '#1A0A00' : 'rgba(242,234,216,0.45)',
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Order list */}
            {error && !loading ? (
              <div className="text-center py-16">
                <p className="font-serif font-bold text-xl mb-2 flex items-center justify-center gap-2" style={{ color: '#F2EAD8' }}><AlertTriangle size={20} style={{ color: '#B8752A' }} /> Couldn't Load Orders</p>
                <p className="text-sm mb-6" style={{ color: '#8C7355' }}>{error}</p>
                <button onClick={loadOrders} className="font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-3"
                  style={{ background: '#B8752A', color: '#1A0A00' }}>
                  Try Again
                </button>
              </div>
            ) : loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 skeleton" style={{ background: 'rgba(184,117,42,0.06)' }} />)}
              </div>
            ) : displayList.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-serif font-bold text-xl mb-2" style={{ color: '#F2EAD8' }}>
                  {tab === 'active' ? 'No active orders.' : 'No past orders.'}
                </p>
                {tab === 'active' && (
                  <Link to="/shop" className="inline-block mt-4 font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-3"
                    style={{ background: '#B8752A', color: '#1A0A00' }}>
                    Order Now
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {displayList.map(order => {
                  const cfg = STATUS_CONFIG[order.status] || { label: order.status, icon: ClipboardList }
                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelected(order)}
                      className="w-full p-4 text-left transition-all hover:border-primary group"
                      style={{
                        background: '#2A1200',
                        border:     '1px solid rgba(184,117,42,0.15)',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = '#B8752A'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(184,117,42,0.15)'}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="font-mono font-bold text-sm" style={{ color: '#E8C88A' }}>
                              {order.order_number}
                            </p>
                            <cfg.icon size={13} style={{ color: '#B8752A' }} />
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
                              style={{ background: 'rgba(184,117,42,0.12)', color: '#B8752A' }}>
                              {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: '#8C7355' }}>
                            {new Date(order.created_at).toLocaleDateString('en-UG', { day:'numeric', month:'short', year:'numeric' })}
                          </p>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <p className="font-bold text-sm" style={{ color: '#F2EAD8' }}>
                            UGX {Number(order.total).toLocaleString()}
                          </p>
                          <p className="text-[10px] mt-0.5" style={{ color: '#8C7355' }}>
                            {order.items_count} item{order.items_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
