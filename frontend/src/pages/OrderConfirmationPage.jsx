import { useParams, useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import api from '../services/api'
import { AlertTriangle, CheckCircle, Mail, MessageCircle, Package } from 'lucide-react'

export default function OrderConfirmationPage() {
  const { token }  = useParams()
  const { state }  = useLocation()
  const [order, setOrder] = useState(state?.order || null)
  const [loading, setLoading] = useState(!state?.order)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!order && token) {
      api.get(`/orders/track/${token}`)
        .then(res => setOrder(res.data.order))
        .catch(err => setError(err.message || 'Unable to load order'))
        .finally(() => setLoading(false))
    }
  }, [token, order])

  if (loading) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-light flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={44} className="text-red-500" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-dark mb-2">Couldn't Load Order</h1>
          <p className="text-gray-500 mb-8">{error}</p>
          <Link to="/account" className="block w-full bg-primary text-dark py-3 rounded-xl font-bold hover:bg-primary/90 transition">
            View My Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center">
        {/* Animated checkmark */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={52} className="text-green-500" />
        </div>

        <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-2">Order Confirmed</p>
        <h1 className="font-serif text-4xl font-bold text-dark mb-2">Thank You!</h1>
        <p className="text-gray-500 mb-8">
          Your order has been received and we're already getting started on it.
        </p>

        {order && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 text-left">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-primary tracking-widest uppercase">Order Number</span>
              <span className="font-mono font-bold text-dark">{order.order_number}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-primary tracking-widest uppercase">Total</span>
              <span className="font-bold text-dark">UGX {Number(order.total).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-primary tracking-widest uppercase">Payment</span>
              <span className="text-dark capitalize">{order.payment_method?.replace('_', ' ')}</span>
            </div>
          </div>
        )}

        <div className="bg-dark text-light rounded-2xl p-5 mb-6 text-left">
          <p className="text-primary text-xs font-semibold tracking-widest uppercase mb-3">What's Next</p>
          <div className="space-y-3 text-sm text-light/80">
            <div className="flex items-center gap-2.5">
              <Mail size={14} style={{ color: '#B8752A', flexShrink: 0 }} />
              <span>Check your email for your order confirmation</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MessageCircle size={14} style={{ color: '#B8752A', flexShrink: 0 }} />
              <span>We'll message you on WhatsApp with updates</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Package size={14} style={{ color: '#B8752A', flexShrink: 0 }} />
              <span>Same-day delivery if ordered before noon</span>
            </div>
          </div>
        </div>

        {token && (
          <Link
            to={`/track/${token}`}
            className="block w-full bg-primary text-dark py-3 rounded-xl font-bold hover:bg-primary/90 transition mb-3"
          >
            Track My Order
          </Link>
        )}

        <Link
          to="/shop"
          className="block w-full border border-gray-200 text-dark py-3 rounded-xl font-medium hover:bg-gray-50 transition"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
