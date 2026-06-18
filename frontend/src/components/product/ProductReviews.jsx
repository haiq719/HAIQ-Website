import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import Button from '../shared/Button'
import { Star, CheckCircle } from 'lucide-react'

// ── Star Rating ───────────────────────────────────────────────────────────────
function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const [hover, setHover] = useState(0)
  const sz = size === 'lg' ? 'text-2xl' : 'text-base'

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`${sz} transition-transform ${!readonly ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
        >
          <span style={{ color: (hover || value) >= star ? '#B8752A' : 'rgba(184,117,42,0.2)' }}>★</span>
        </button>
      ))}
    </div>
  )
}

// ── Single review card ────────────────────────────────────────────────────────
function ReviewCard({ review }) {
  return (
    <div className="py-5" style={{ borderBottom: '1px solid rgba(184,117,42,0.15)' }}>
      <div className="flex items-start justify-between mb-2 gap-4">
        <div>
          <p className="font-semibold text-sm" style={{ color: '#F2EAD8' }}>{review.name}</p>
          {review.verified_purchase && (
            <span className="text-[10px] font-medium px-2 py-0.5"
              style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80' }}>
              ✓ Verified Purchase
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <StarRating value={review.rating} readonly size="sm" />
          <span className="text-[10px]" style={{ color: '#8C7355' }}>
            {new Date(review.created_at).toLocaleDateString('en-UG', {
              day: 'numeric', month: 'short', year: 'numeric',
            })}
          </span>
        </div>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: 'rgba(242,234,216,0.55)' }}>
        {review.comment}
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProductReviews({ productSlug }) {
  const { user } = useAuth()

  // Auto-fill display name from signed-in user — no token needed
  const autoName = user
    ? (user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim())
    : ''

  const [reviews,    setReviews]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showForm,   setShowForm]   = useState(false)
  const [rating,     setRating]     = useState(5)
  const [comment,    setComment]    = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status,     setStatus]     = useState(null) // null | 'success' | 'error'

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null

  useEffect(() => {
    api.get(`/products/${productSlug}/reviews`)
      .then(res => setReviews(res.data.reviews || []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [productSlug])

  const containsHtml = (value = '') => /<[^>]*>/.test(value) || /javascript:/i.test(value)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    if (containsHtml(comment)) { setStatus('error'); return }
    // Must be signed in — name comes from account, no token field
    if (!user) return

    setSubmitting(true)
    setStatus(null)
    try {
      await api.post(`/products/${productSlug}/reviews`, {
        rating,
        comment: comment.trim(),
        name:    autoName || 'Anonymous',
        // No tracking_token — verified_purchase is determined server-side by order history
      })
      setStatus('success')
      setComment('')
      setShowForm(false)
      const res = await api.get(`/products/${productSlug}/reviews`)
      setReviews(res.data.reviews || [])
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-16 md:mt-20">

      {/* Header */}
      <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase mb-1" style={{ color: '#B8752A' }}>
            Customer Feedback
          </p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold" style={{ color: '#1A0A00' }}>
            Reviews
          </h2>
        </div>

        {avgRating && (
          <div className="text-right">
            <p className="font-serif font-bold text-4xl leading-none" style={{ color: '#1A0A00' }}>
              {avgRating}
            </p>
            <StarRating value={Math.round(avgRating)} readonly />
            <p className="text-xs mt-0.5" style={{ color: '#8C7355' }}>
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="py-5" style={{ borderBottom: '1px solid rgba(184,117,42,0.1)' }}>
              <div className="h-3 skeleton rounded mb-2" style={{ width: '30%', background: 'rgba(184,117,42,0.08)' }} />
              <div className="h-3 skeleton rounded mb-1" style={{ width: '100%', background: 'rgba(184,117,42,0.06)' }} />
              <div className="h-3 skeleton rounded" style={{ width: '75%', background: 'rgba(184,117,42,0.06)' }} />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center" style={{ background: '#F2EAD8', border: '1px solid rgba(184,117,42,0.15)' }}>
          <Star size={32} style={{ color: 'rgba(184,117,42,0.4)' }} className="mb-3 mx-auto" />
          <p className="font-serif text-lg font-bold mb-1" style={{ color: '#1A0A00' }}>No reviews yet</p>
          <p className="text-sm" style={{ color: '#8C7355' }}>Be the first to share your experience.</p>
        </div>
      ) : (
        <div>
          {reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
        </div>
      )}

      {/* Success */}
      {status === 'success' && (
        <div className="mt-4 px-4 py-3 text-sm flex items-center gap-2" style={{ background: 'rgba(184,117,42,0.08)', border: '1px solid rgba(184,117,42,0.25)', color: '#E8C88A' }}>
          <CheckCircle size={15} style={{ color: '#B8752A', flexShrink: 0 }} />
          Your review has been submitted and is pending approval.
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="mt-4 px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
          Something went wrong. Please try again.
        </div>
      )}

      {/* Leave a review */}
      <div className="mt-8">
        {!user ? (
          // Not signed in — prompt to login
          <div className="px-5 py-4" style={{ background: '#F2EAD8', border: '1px solid rgba(184,117,42,0.2)' }}>
            <p className="text-sm font-medium mb-2" style={{ color: '#1A0A00' }}>
              Sign in to leave a review
            </p>
            <p className="text-xs mb-3" style={{ color: '#8C7355' }}>
              Your name is automatically used from your account — no extra steps.
            </p>
            <Link
              to="/login"
              className="inline-block font-bold text-[11px] tracking-[0.2em] uppercase px-5 py-2.5 transition-opacity hover:opacity-80"
              style={{ background: '#B8752A', color: '#1A0A00' }}
            >
              Sign In to Review
            </Link>
          </div>
        ) : !showForm ? (
          <Button onClick={() => setShowForm(true)} variant="secondary" size="md">
            Leave a Review
          </Button>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-5 md:p-6"
            style={{ background: '#F2EAD8', border: '1px solid rgba(184,117,42,0.2)' }}
          >
            <h3 className="font-serif text-xl font-bold mb-5" style={{ color: '#1A0A00' }}>
              Your Review
            </h3>

            {/* Signed-in user name — shown but not editable */}
            <div className="flex items-center gap-3 mb-5 px-3 py-2.5"
              style={{ background: 'rgba(184,117,42,0.08)', border: '1px solid rgba(184,117,42,0.2)' }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ background: '#B8752A', color: '#1A0A00' }}>
                {autoName?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#1A0A00' }}>{autoName}</p>
                <p className="text-[10px]" style={{ color: '#8C7355' }}>Your review will appear under this name</p>
              </div>
            </div>

            {/* Star rating */}
            <div className="mb-5">
              <label className="block text-xs font-semibold mb-2" style={{ color: '#1A0A00' }}>Your Rating</label>
              <StarRating value={rating} onChange={setRating} size="lg" />
            </div>

            {/* Comment */}
            <div className="mb-5">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#1A0A00' }}>
                Your Review <span style={{ color: '#B8752A' }}>*</span>
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                required
                rows={4}
                placeholder="What did you love about it? What made it stand out?"
                className="w-full px-4 py-2.5 text-sm focus:outline-none resize-none"
                style={{
                  background:  '#fff',
                  border:      '1px solid rgba(184,117,42,0.3)',
                  color:       '#1A0A00',
                }}
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Button type="submit" disabled={submitting || !comment.trim()} loading={submitting} variant="primary" size="md">
                Submit Review
              </Button>
              <Button type="button" onClick={() => { setShowForm(false); setStatus(null) }} variant="muted" size="sm">
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
