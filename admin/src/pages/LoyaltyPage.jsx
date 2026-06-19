import { useState, useEffect } from 'react'
import adminApi from '../services/adminApi'
import Button from '../components/shared/Button'
import StatusBadge from '../components/shared/StatusBadge'
import { PageShell, PageHeader, Card, Pill, EmptyState } from '../components/shared/ui'
import { usePop } from '../lib/anim'
import { Crown, X, Truck, PackageCheck, MapPin, Phone, AlertTriangle, Check } from 'lucide-react'

// ── Review modal ──────────────────────────────────────────────────────────────
function ReviewModal({ card, onClose, onDone }) {
  const [action,     setAction]     = useState('')
  const [cardNumber, setCardNumber] = useState(`HAIQ-${Date.now().toString(36).toUpperCase()}`)
  const [notes,      setNotes]      = useState('')
  const [saving,     setSaving]     = useState(false)
  const [error,      setError]      = useState(null)
  const popRef = usePop()

  const submit = async () => {
    if (!action) { setError('Select an action.'); return }
    setSaving(true); setError(null)
    try {
      await adminApi.patch(`/admin/loyalty/${card.id}`, { action, card_number: cardNumber, admin_notes: notes })
      onDone(); onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
      <div ref={popRef} className="w-full max-w-md rounded-xl overflow-hidden" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.3)' }}>
        <div className="flex items-center gap-2 px-6 py-4" style={{ borderBottom: '1px solid #3D2000' }}>
          <Crown size={15} style={{ color: '#B8752A' }} />
          <h2 className="font-serif font-bold text-lg" style={{ color: '#F2EAD8' }}>Review Application</h2>
          <button onClick={onClose} className="ml-auto hover:opacity-60 transition" style={{ color: '#8C7355' }}>
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Customer info */}
          <div className="p-4 rounded-lg" style={{ background: '#1A0A00', border: '1px solid #3D2000' }}>
            <p className="font-bold text-sm mb-1" style={{ color: '#F2EAD8' }}>{card.full_name}</p>
            <p className="text-xs mb-0.5" style={{ color: '#8C7355' }}>{card.email}</p>
            <p className="text-xs mb-3" style={{ color: '#8C7355' }}>{card.phone}</p>

            <div className="pt-3" style={{ borderTop: '1px solid #3D2000' }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5" style={{ color: '#8C7355' }}>
                <MapPin size={11} /> Card Delivery Address
              </p>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(242,234,216,0.7)' }}>{card.delivery_address}</p>
            </div>

            {card.contact_phone && (
              <div className="pt-3 mt-3" style={{ borderTop: '1px solid #3D2000' }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-1 flex items-center gap-1.5" style={{ color: '#8C7355' }}>
                  <Phone size={11} /> Phone for Delivery
                </p>
                <p className="text-sm" style={{ color: 'rgba(242,234,216,0.7)' }}>{card.contact_phone}</p>
              </div>
            )}
          </div>

          {/* Action selection */}
          <div className="grid grid-cols-2 gap-2">
            {['approve', 'reject'].map(a => (
              <Button key={a} onClick={() => setAction(a)} variant={a === 'approve' ? 'primary' : 'danger'}
                className={`w-full ${action === a ? '' : 'opacity-70'}`} size="sm">
                {a === 'approve' ? <><Check size={13} /> Approve</> : <><X size={13} /> Reject</>}
              </Button>
            ))}
          </div>

          {action === 'approve' && (
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8C7355' }}>Assign Card Number</label>
              <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="admin-input font-mono" />
            </div>
          )}

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#8C7355' }}>Internal Notes (optional)</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className="admin-input resize-none" />
          </div>

          {error && <p className="text-xs flex items-center gap-1.5" style={{ color: '#f87171' }}><AlertTriangle size={13} /> {error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4" style={{ borderTop: '1px solid #3D2000' }}>
          <Button onClick={onClose} variant="muted" size="sm">Cancel</Button>
          <Button onClick={submit} disabled={saving || !action} loading={saving} variant="primary" size="sm">Confirm</Button>
        </div>
      </div>
    </div>
  )
}

// ── Cards table ───────────────────────────────────────────────────────────────
function CardsTable({ cards, loading, onReview, onDispatch, onDeliver }) {
  if (!loading && cards.length === 0) return (
    <Card><EmptyState icon={Crown} title="No cards here" sub="No loyalty cards in this category yet." /></Card>
  )

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="overflow-x-auto admin-scroll">
        <table className="w-full text-sm min-w-[680px]">
          <thead>
            <tr style={{ borderBottom: '1px solid #3D2000' }}>
              {['Customer','Email','Delivery Address','Card No.','Status','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: '#8C7355' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array(3).fill(null).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}>
                    {Array(6).fill(null).map((__, j) => <td key={j} className="px-4 py-4"><div className="h-2.5 rounded skeleton" style={{ background: '#3D2000', width: '70%' }} /></td>)}
                  </tr>
                ))
              : cards.map(c => (
                  <tr key={c.id} className="transition-colors" style={{ borderBottom: '1px solid rgba(61,32,0,0.4)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,117,42,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-4 py-4">
                      <p className="text-xs font-medium" style={{ color: '#F2EAD8' }}>{c.full_name}</p>
                      <p className="text-[10px]" style={{ color: '#8C7355' }}>{c.contact_phone || '—'}</p>
                    </td>
                    <td className="px-4 py-4 text-[10px] max-w-[140px] truncate" style={{ color: '#8C7355' }}>{c.email}</td>
                    <td className="px-4 py-4 text-xs max-w-[180px]"><p className="truncate" style={{ color: 'rgba(242,234,216,0.6)' }}>{c.delivery_address}</p></td>
                    <td className="px-4 py-4 font-mono text-[10px]" style={{ color: '#E8C88A' }}>{c.card_number || '—'}</td>
                    <td className="px-4 py-4"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2 flex-wrap">
                        {c.status === 'pending'    && <Button onClick={() => onReview(c)}   size="sm" variant="secondary" className="text-[10px]">Review</Button>}
                        {c.status === 'approved'   && <Button onClick={() => onDispatch(c)} size="sm" variant="primary" className="text-[10px]"><Truck size={12} /> Dispatch</Button>}
                        {c.status === 'dispatched' && <Button onClick={() => onDeliver(c)}  size="sm" variant="secondary" className="text-[10px]"><PackageCheck size={12} /> Delivered</Button>}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

const TABS = [
  { key: 'pending',  label: 'Pending'        },
  { key: 'approved', label: 'Dispatch Queue' },
  { key: 'all',      label: 'All Cards'      },
]

export default function LoyaltyPage() {
  const [tab,         setTab]         = useState('pending')
  const [cards,       setCards]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [reviewModal, setReviewModal] = useState(null)

  const load = () => {
    setLoading(true)
    const q = tab === 'all' ? '' : `?status=${tab}`
    adminApi.get(`/admin/loyalty${q}`)
      .then(r => setCards(r.data.cards || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [tab])

  const doAction = async (cardId, action) => {
    try {
      await adminApi.patch(`/admin/loyalty/${cardId}`, { action })
      load()
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed.')
    }
  }

  return (
    <PageShell deps={[loading, tab]} max="1100px">
      <PageHeader label="Membership" title="Loyalty Cards" icon={Crown} actions={
        <Pill color="#8C7355">Physical card · one per customer</Pill>
      } />

      {/* Tabs */}
      <div className="flex gap-1 p-1 w-fit rounded-lg" style={{ background: '#2A1200', border: '1px solid #3D2000' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all"
            style={tab===t.key ? { background: '#B8752A', color: '#1A0A00' } : { color: 'rgba(242,234,216,0.45)' }}>
            {t.label}
          </button>
        ))}
      </div>

      <CardsTable cards={cards} loading={loading}
        onReview={c => setReviewModal(c)}
        onDispatch={c => doAction(c.id, 'dispatch')}
        onDeliver={c => doAction(c.id, 'deliver')} />

      {reviewModal && <ReviewModal card={reviewModal} onClose={() => setReviewModal(null)} onDone={load} />}
    </PageShell>
  )
}
