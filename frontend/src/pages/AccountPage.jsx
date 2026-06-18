// frontend/src/pages/AccountPage.jsx — without Messages tab
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Crown from '../components/shared/Crown'
import Button from '../components/shared/Button'
import { AlertTriangle } from 'lucide-react'

// ── Profile Tab ───────────────────────────────────────────────
function ProfileTab({ user, onUpdated }) {
  const fullName = user?.full_name || `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
  const [form,    setForm]    = useState({ full_name: fullName, phone: user?.phone || '' })
  const [pwForm,  setPwForm]  = useState({ current: '', next: '', confirm: '' })
  const [saving,  setSaving]  = useState(false)
  const [pwSaving,setPwSaving]= useState(false)
  const [msg,     setMsg]     = useState(null)
  const [pwMsg,   setPwMsg]   = useState(null)

  const containsHtml = (value = '') => /<[^>]*>/.test(value) || /javascript:/i.test(value)

  const upd   = k => e => setForm(f => ({ ...f, [k]: e.target.value }))
  const updPw = k => e => setPwForm(f => ({ ...f, [k]: e.target.value }))

  const saveProfile = async () => {
    if (containsHtml(form.full_name) || containsHtml(form.phone)) {
      setMsg({ ok: false, text: 'Please remove HTML or script content.' })
      return
    }
    setSaving(true); setMsg(null)
    try {
      const parts = form.full_name.trim().split(' ')
      await api.put('/auth/profile', {
        full_name:  form.full_name.trim(),
        first_name: parts[0],
        last_name:  parts.slice(1).join(' '),
        phone:      form.phone.trim(),
      })
      setMsg({ ok: true, text: 'Profile updated.' })
      onUpdated?.()
    } catch { setMsg({ ok: false, text: 'Could not save. Try again.' }) }
    finally { setSaving(false) }
  }

  const changePw = async () => {
    if (containsHtml(pwForm.current) || containsHtml(pwForm.next) || containsHtml(pwForm.confirm)) {
      setPwMsg('Please remove HTML or script content.');
      return
    }
    if (pwForm.next.length < 6)          { setPwMsg('Minimum 6 characters.'); return }
    if (!/[!@#$%^&*]/.test(pwForm.next)) { setPwMsg('Include at least one special character.'); return }
    if (pwForm.next !== pwForm.confirm)   { setPwMsg('Passwords do not match.'); return }
    setPwSaving(true); setPwMsg(null)
    try {
      await api.put('/auth/password', { current_password: pwForm.current, new_password: pwForm.next })
      setPwMsg('Password updated.')
      setPwForm({ current: '', next: '', confirm: '' })
    } catch (err) { setPwMsg(err.response?.data?.error || 'Failed.') }
    finally { setPwSaving(false) }
  }

  const iSty = { background: '#1A0A00', border: '1px solid rgba(184,117,42,0.2)', color: '#F2EAD8' }
  const iCls = 'w-full px-4 py-3 text-sm focus:outline-none'
  const lbl  = (t) => <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>{t}</label>

  return (
    <div className="space-y-10 max-w-lg">
      <div className="space-y-4">
        <p className="font-serif font-bold text-xl" style={{ color: '#F2EAD8' }}>Your Details</p>
        <div>{lbl('Full Name')}<input value={form.full_name} onChange={upd('full_name')} className={iCls} style={iSty} /></div>
        <div>{lbl('Phone')}<input type="tel" value={form.phone} onChange={upd('phone')} className={iCls} style={iSty} /></div>
        <div>{lbl('Email (cannot change)')}<input value={user?.email} readOnly className={`${iCls} cursor-not-allowed`} style={{ ...iSty, opacity: 0.4 }} /></div>
        {msg && <p className="text-xs" style={{ color: msg.ok ? '#B8752A' : '#f87171' }}>{msg.text}</p>}
        <Button onClick={saveProfile} disabled={saving} loading={saving} variant="primary" size="md">
          Save Changes
        </Button>
      </div>

      <div className="space-y-4 pt-8" style={{ borderTop: '1px solid rgba(184,117,42,0.2)' }}>
        <p className="font-serif font-bold text-xl" style={{ color: '#F2EAD8' }}>Change Password</p>
        {[['Current Password','current'],['New Password','next'],['Confirm New Password','confirm']].map(([l,k]) => (
          <div key={k}>{lbl(l)}<input type="password" value={pwForm[k]} onChange={updPw(k)} className={iCls} style={iSty} /></div>
        ))}
        {pwMsg && <p className="text-xs" style={{ color: pwMsg === 'Password updated.' ? '#B8752A' : '#f87171' }}>{pwMsg}</p>}
        <Button onClick={changePw} disabled={pwSaving} loading={pwSaving} variant="secondary" size="md">
          Update Password
        </Button>
      </div>
    </div>
  )
}

// ── Orders Tab ────────────────────────────────────────────────
function OrdersTab() {
  const [orders, setOrders]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]    = useState(null)
  useEffect(() => {
    api.get('/orders/my').then(r => setOrders(r.data.orders || [])).catch(err => setError(err.message || 'Failed to load orders')).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-14 skeleton" style={{ background: 'rgba(184,117,42,0.06)' }} />)}</div>

  if (error) return (
    <div className="py-12 text-center">
      <p className="font-serif text-xl font-bold mb-3 flex items-center justify-center gap-2" style={{ color: '#F2EAD8' }}><AlertTriangle size={20} style={{ color: '#B8752A' }} />Couldn't Load Orders</p>
      <p className="text-sm mb-4" style={{ color: '#8C7355' }}>{error}</p>
      <button onClick={() => window.location.reload()} className="font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-3"
        style={{ background: '#B8752A', color: '#1A0A00' }}>Try Again</button>
    </div>
  )

  if (!orders.length) return (
    <div className="py-12 text-center">
      <p className="font-serif text-xl font-bold mb-3" style={{ color: '#F2EAD8' }}>No orders yet.</p>
      <Link to="/shop" className="inline-block mt-2 font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-3"
        style={{ background: '#B8752A', color: '#1A0A00' }}>Shop Now</Link>
    </div>
  )

  const STATUS_COLOR = {
    pending: '#E8C88A', freshly_kneaded: '#60a5fa', ovenbound: '#fb923c',
    on_the_cart: '#a78bfa', en_route: '#D4A574', delivered: '#4ade80', cancelled: '#f87171',
  }

  return (
    <div className="space-y-3 max-w-lg">
      {orders.map(o => (
        <Link key={o.id} to={`/track/${o.tracking_token}`}
          className="flex items-center justify-between gap-4 p-4 block transition-all group"
          style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.15)', textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#B8752A'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(184,117,42,0.15)'}
        >
          <div>
            <p className="font-mono font-bold text-sm" style={{ color: '#E8C88A' }}>{o.order_number}</p>
            <p className="text-[10px] mt-0.5 font-semibold uppercase tracking-wider"
              style={{ color: STATUS_COLOR[o.status] || '#8C7355' }}>
              {o.status?.replace(/_/g,' ')}
            </p>
          </div>
          <p className="font-bold text-sm" style={{ color: '#B8752A' }}>UGX {Number(o.total).toLocaleString()}</p>
        </Link>
      ))}
    </div>
  )
}

// ── Loyalty Card Tab ──────────────────────────────────────────
function LoyaltyTab({ user }) {
  const [card,      setCard]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [applyOpen, setApplyOpen] = useState(false)
  const [address,   setAddress]   = useState('')
  const [phone,     setPhone]     = useState(user?.phone || '')
  const [submitting,setSubmitting]= useState(false)
  const [err,       setErr]       = useState(null)

  const containsHtml = (value = '') => /<[^>]*>/.test(value) || /javascript:/i.test(value)

  useEffect(() => {
    api.get('/loyalty/me').then(r => setCard(r.data.card)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleApply = async () => {
    if (containsHtml(address) || containsHtml(phone)) { setErr('Please remove HTML or script content.'); return }
    if (address.trim().length < 5) { setErr('Enter your full delivery address.'); return }
    if (phone.trim().length < 7)   { setErr('Enter a phone number for card delivery.'); return }
    setSubmitting(true); setErr(null)
    try {
      const r = await api.post('/loyalty/apply', { delivery_address: address.trim(), contact_phone: phone.trim() })
      setCard(r.data.card); setApplyOpen(false)
    } catch (e) { setErr(e.response?.data?.error || 'Could not submit.') }
    finally { setSubmitting(false) }
  }

  const STATUS = {
    pending:    { label: 'Under Review',   color: '#E8C88A' },
    approved:   { label: 'Approved',       color: '#4ade80' },
    rejected:   { label: 'Not Approved',   color: '#f87171' },
    dispatched: { label: 'On Its Way',     color: '#B8752A' },
    delivered:  { label: 'Delivered',      color: '#4ade80' },
  }

  const iSty = { background: '#1A0A00', border: '1px solid rgba(184,117,42,0.2)', color: '#F2EAD8' }

  return (
    <div className="max-w-lg space-y-5">
      <div className="p-6 relative overflow-hidden" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
        <div className="absolute -top-4 -right-4 opacity-[0.04] pointer-events-none">
          <Crown size={120} color="#E8C88A" />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <Crown size={16} color="#B8752A" />
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em]" style={{ color: '#8C7355' }}>HAIQ Loyalty Card</p>
        </div>
        {loading ? (
          <div className="h-8 skeleton rounded" style={{ background: 'rgba(184,117,42,0.08)', width: '60%' }} />
        ) : card ? (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5"
              style={{ background: `${STATUS[card.status]?.color}20`, color: STATUS[card.status]?.color || '#8C7355' }}>
              {STATUS[card.status]?.label || card.status}
            </span>
            {card.card_number && <p className="font-mono font-bold text-xl mt-3" style={{ color: '#E8C88A' }}>{card.card_number}</p>}
            {card.delivery_address && <p className="text-xs mt-3" style={{ color: '#8C7355' }}>Sending to: {card.delivery_address}</p>}
          </>
        ) : (
          <p className="text-sm" style={{ color: 'rgba(242,234,216,0.45)' }}>You haven't applied for a loyalty card yet.</p>
        )}
        {(!card || card?.status === 'rejected') && !applyOpen && (
          <Button onClick={() => setApplyOpen(true)} variant="primary" size="sm" className="mt-4">
            Apply for Card
          </Button>
        )}
      </div>

      {applyOpen && (
        <div className="p-5" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.3)' }}>
          <p className="font-serif font-bold text-lg mb-4" style={{ color: '#F2EAD8' }}>Apply for HAIQ Card</p>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>Delivery Address *</label>
              <textarea rows={2} value={address} onChange={e => setAddress(e.target.value)}
                placeholder="Plot 12, Muyenga Hill, Kampala..." className="w-full px-4 py-2.5 text-sm resize-none focus:outline-none" style={iSty} />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>Phone for Delivery *</label>
              <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="+256 700 000 000" className="w-full px-4 py-3 text-sm focus:outline-none" style={iSty} />
            </div>
          </div>
          {err && <p className="text-red-400 text-xs mt-3">{err}</p>}
          <div className="flex gap-3 mt-5">
            <Button onClick={handleApply} disabled={submitting} loading={submitting} variant="primary" size="sm">
              Submit Application
            </Button>
            <Button onClick={() => setApplyOpen(false)} variant="muted" size="sm">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
const TABS = [
  { key: 'profile',  label: 'Profile'      },
  { key: 'orders',   label: 'Orders'       },
  { key: 'loyalty',  label: 'Loyalty Card' },
]

export default function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')

  if (!user) return (
    <div style={{ background: '#0E0600', minHeight: '80vh' }} className="flex items-center justify-center">
      <div className="text-center px-6">
        <p className="text-sm mb-4" style={{ color: '#8C7355' }}>Please sign in to view your account.</p>
        <Link to="/login" className="inline-block font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-3"
          style={{ background: '#B8752A', color: '#1A0A00' }}>Sign In</Link>
      </div>
    </div>
  )

  const firstName = (user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim()).split(' ')[0] || 'Account'

  return (
    <div style={{ background: '#0E0600', minHeight: '100vh' }}>
      <div className="border-b px-6 md:px-16 py-12 md:py-16" style={{ borderColor: 'rgba(184,117,42,0.2)' }}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] mb-2" style={{ color: '#B8752A' }}>Made For You</p>
        <h1 className="font-serif font-bold" style={{ fontSize: 'clamp(2rem,5vw,4rem)', color: '#F2EAD8' }}>
          {firstName}.
        </h1>
      </div>

      <div className="px-6 md:px-16 py-8">
        <div className="flex border-b mb-8 overflow-x-auto scrollbar-hide" style={{ borderColor: 'rgba(184,117,42,0.2)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-shrink-0 px-4 py-3 text-[11px] font-bold tracking-[0.2em] uppercase border-b-2 transition -mb-px mr-2"
              style={{
                borderColor: tab === t.key ? '#B8752A' : 'transparent',
                color:       tab === t.key ? '#B8752A' : 'rgba(242,234,216,0.35)',
                whiteSpace:  'nowrap',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile'  && <ProfileTab user={user} onUpdated={() => {}} />}
        {tab === 'orders'   && <OrdersTab />}
        {tab === 'loyalty'  && <LoyaltyTab user={user} />}
      </div>
    </div>
  )
}