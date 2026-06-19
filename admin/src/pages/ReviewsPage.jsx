// ReviewsPage.jsx
import { useEffect, useState } from 'react'
import adminApi from '../services/adminApi'
import { Star, Check, X, MessageSquareQuote, BadgeCheck } from 'lucide-react'
import { PageShell, PageHeader, Card, Pill, EmptyState, Skeleton } from '../components/shared/ui'
import StatusBadge from '../components/shared/StatusBadge'

function Stars({ rating }) {
  return (
    <div className="flex gap-0.5">
      {Array(5).fill(null).map((_, i) => (
        <Star key={i} size={14} strokeWidth={1.5}
          fill={i < rating ? '#B8752A' : 'none'}
          color={i < rating ? '#B8752A' : '#8C7355'} />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const [reviews,  setReviews]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('pending')
  const [updating, setUpdating] = useState(null)

  const load = () => {
    setLoading(true)
    adminApi.get('/admin/reviews')
      .then(res => setReviews(res.data.reviews || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const updateReview = async (id, status) => {
    setUpdating(id)
    try {
      await adminApi.patch(`/admin/reviews/${id}`, { status })
      load()
    } catch (e) { console.error(e) }
    finally { setUpdating(null) }
  }

  const visible = filter === 'all' ? reviews : reviews.filter(r => r.status === filter)
  const pending = reviews.filter(r => r.status === 'pending').length
  const TABS = ['pending', 'approved', 'rejected', 'all']

  return (
    <PageShell deps={[loading]} max="1000px">
      <PageHeader label="Manage" title="Reviews" icon={MessageSquareQuote} />

      {pending > 0 && (
        <Card className="!py-3 flex items-center gap-3"
          style={{ background: 'rgba(232,200,138,0.08)', borderColor: 'rgba(232,200,138,0.3)' }}>
          <Star size={18} strokeWidth={1.5} fill="#E8C88A" color="#E8C88A" className="flex-shrink-0" />
          <p className="text-sm" style={{ color: '#E8C88A' }}>
            <strong>{pending}</strong> review{pending > 1 ? 's' : ''} awaiting moderation.
          </p>
        </Card>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(f => {
          const active = filter === f
          return (
            <button key={f} onClick={() => setFilter(f)}
              className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full transition-all flex items-center gap-2"
              style={active
                ? { background: '#B8752A', color: '#1A0A00' }
                : { border: '1px solid #3D2000', color: 'rgba(242,234,216,0.45)' }}>
              {f === 'all' ? 'All' : f}
              {f === 'pending' && pending > 0 && (
                <span className="rounded-full px-1.5 py-0.5 text-[9px]"
                  style={{ background: active ? '#1A0A00' : '#E8C88A', color: active ? '#E8C88A' : '#1A0A00' }}>
                  {pending}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading ? Array(4).fill(null).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : visible.length === 0 ? (
            <Card><EmptyState icon={MessageSquareQuote} title="No reviews here" sub="Nothing in this category yet." /></Card>
          ) : visible.map(review => (
            <Card key={review.id}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold" style={{ color: '#F2EAD8' }}>{review.name}</p>
                    <Stars rating={review.rating} />
                    <StatusBadge status={review.status} />
                    {review.verified_purchase && <Pill color="#B8752A" icon={BadgeCheck}>Verified</Pill>}
                  </div>
                  <p className="text-xs uppercase tracking-wider" style={{ color: 'rgba(184,117,42,0.7)' }}>
                    {review.product_name}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(242,234,216,0.65)' }}>"{review.comment}"</p>
                  <p className="text-xs" style={{ color: 'rgba(242,234,216,0.25)' }}>
                    {new Date(review.created_at).toLocaleDateString('en-UG', { timeZone: 'Africa/Kampala' })}
                  </p>
                </div>

                <div className="flex flex-col gap-2 flex-shrink-0">
                  {review.status !== 'approved' && (
                    <button onClick={() => updateReview(review.id, 'approved')} disabled={updating === review.id}
                      className="admin-btn-primary px-4 py-1.5 text-[10px] disabled:opacity-40">
                      <Check size={12} /> Approve
                    </button>
                  )}
                  {review.status !== 'rejected' && (
                    <button onClick={() => updateReview(review.id, 'rejected')} disabled={updating === review.id}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors disabled:opacity-40"
                      style={{ border: '1px solid rgba(248,113,113,0.4)', color: '#f87171' }}>
                      <X size={12} /> Reject
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
      </div>
    </PageShell>
  )
}
