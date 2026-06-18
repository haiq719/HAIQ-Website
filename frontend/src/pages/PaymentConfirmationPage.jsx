import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import api from '../services/api'
import { CheckCircle, AlertTriangle } from 'lucide-react'

const PAYMENT_METHODS = {
  mtn_momo: {
    label: 'MTN Mobile Money',
    ussd: '*165*3#',
    merchantCode: '170010',
    logo: '/logos/mtn-logo.svg',
    color: '#FFD700',
  },
  airtel: {
    label: 'Airtel Money',
    ussd: '*185*9#',
    merchantCode: '100010',
    logo: '/logos/airtel-logo.svg',
    color: '#DC143C',
  },
}

export default function PaymentConfirmationPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [status, setStatus] = useState('waiting') // waiting | verified | failed | timeout | error
  const [attempts, setAttempts] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState(location.state?.paymentMethod || 'mtn_momo')
  const [orderData, setOrderData] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(300) // 5 minutes
  const [pollError, setPollError] = useState(null)
  const [failureCount, setFailureCount] = useState(0)

  const config = PAYMENT_METHODS[paymentMethod]

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true })
      return
    }

    // Start polling for payment status
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await api.get(`/orders/track/${token}`)
        setOrderData(data)
        setFailureCount(0)
        setPollError(null)

        if (data.payment_status === 'paid') {
          setStatus('verified')
          clearInterval(pollInterval)
          // Redirect to confirmation after 2 seconds
          setTimeout(() => {
            navigate(`/order-confirmation/${token}`, { replace: true })
          }, 2000)
        }
      } catch (err) {
        console.error('Failed to check payment status:', err)
        setFailureCount(c => c + 1)
        setPollError(err.message || 'Network error checking payment status')
        // Show error after 3 consecutive failures (9 seconds)
        if (failureCount >= 2) {
          setStatus('error')
          clearInterval(pollInterval)
        }
      }

      setAttempts(a => a + 1)
    }, 3000) // Poll every 3 seconds

    // Set timeout after 5 minutes
    const timeoutId = setTimeout(() => {
      if (status === 'waiting') {
        setStatus('timeout')
        clearInterval(pollInterval)
      }
    }, 300000)

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setTimeRemaining(t => {
        if (t <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => {
      clearInterval(pollInterval)
      clearInterval(countdownInterval)
      clearTimeout(timeoutId)
    }
  }, [token, navigate, status])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (status === 'verified') {
    return (
      <div style={{ background: '#0E0600', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="text-center px-4">
          <CheckCircle size={56} style={{ color: '#B8752A' }} className="mb-6 mx-auto" />
          <h1 className="font-serif text-3xl mb-2" style={{ color: '#F2EAD8' }}>Payment Verified!</h1>
          <p style={{ color: '#8C7355' }}>Your order is being confirmed...</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={{ background: '#0E0600', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="max-w-md px-4">
          <div className="text-center mb-8">
            <AlertTriangle size={56} style={{ color: '#B8752A' }} className="mb-6 mx-auto" />
            <h1 className="font-serif text-3xl mb-2" style={{ color: '#F2EAD8' }}>Connection Error</h1>
            <p style={{ color: '#8C7355' }} className="mb-6">
              {pollError || 'Unable to check payment status. Please try again.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setStatus('waiting')
                setFailureCount(0)
                setPollError(null)
                setAttempts(0)
              }}
              className="flex-1 py-3 font-bold text-[11px] tracking-[0.2em] uppercase"
              style={{ background: '#B8752A', color: '#1A0A00' }}
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/shop', { replace: true })}
              className="flex-1 py-3 font-bold text-[11px] tracking-[0.2em] uppercase"
              style={{ background: 'transparent', color: '#8C7355', border: '1px solid rgba(184,117,42,0.3)' }}
            >
              Return to Shop
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'timeout') {
    return (
      <div style={{ background: '#0E0600', minHeight: '100vh' }} className="flex items-center justify-center">
        <div className="max-w-md px-4">
          <div className="text-center mb-8">
            <div className="text-6xl mb-6">⏱️</div>
            <h1 className="font-serif text-3xl mb-2" style={{ color: '#F2EAD8' }}>Payment Timeout</h1>
            <p style={{ color: '#8C7355' }} className="mb-6">
              We didn't receive payment confirmation after 5 minutes. Please try again.
            </p>
          </div>
          <button
            onClick={() => navigate('/shop', { replace: true })}
            className="w-full py-3 font-bold text-[11px] tracking-[0.2em] uppercase"
            style={{ background: '#B8752A', color: '#1A0A00' }}
          >
            Return to Shop
          </button>
        </div>
      </div>
    )
  }

  // Waiting for payment
  return (
    <div style={{ background: '#0E0600', minHeight: '100vh' }} className="flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src={config.logo} alt={config.label} className="h-16 w-auto object-contain mx-auto mb-6 bg-white rounded p-2" />
          <h1 className="font-serif text-3xl mb-2" style={{ color: '#F2EAD8' }}>Complete Payment</h1>
          <p style={{ color: '#8C7355' }}>We're waiting for your payment confirmation</p>
        </div>

        {/* Main instructions */}
        <div className="p-6 rounded-lg mb-6" style={{ background: '#2A1200', border: '2px solid rgba(184,117,42,0.3)' }}>
          <div className="text-center mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-3" style={{ color: '#B8752A' }}>
              Dial this code from your {config.label.split(' ')[0]} phone:
            </p>
            <p className="text-4xl font-bold font-mono mb-2" style={{ color: '#B8752A', letterSpacing: '4px' }}>
              {config.ussd}
            </p>
            <p className="text-[10px]" style={{ color: '#8C7355' }}>
              Then follow the prompts to complete payment
            </p>
          </div>

          <div style={{ borderTop: '1px solid rgba(184,117,42,0.2)', paddingTop: '16px' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-3" style={{ color: '#B8752A' }}>
              Merchant Code:
            </p>
            <div className="bg-black/20 rounded px-3 py-2 font-mono text-lg font-bold text-center mb-4" style={{ color: '#B8752A' }}>
              {config.merchantCode}
            </div>
            <p className="text-[10px]" style={{ color: '#8C7355' }}>
              Enter this merchant code when prompted during payment
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="text-center mb-6">
          <div className="inline-block">
            <div className="w-12 h-12 rounded-full border-4 border-transparent animate-spin" style={{ 
              borderTopColor: '#B8752A',
              borderRightColor: 'rgba(184,117,42,0.3)',
            }} />
          </div>
          <p className="text-xs mt-4" style={{ color: '#8C7355' }}>
            Waiting for payment confirmation...
          </p>
          <p className="text-xs font-mono mt-2" style={{ color: '#8C7355' }}>
            Time remaining: {formatTime(timeRemaining)}
          </p>
          <p className="text-[10px] mt-1" style={{ color: 'rgba(139,115,85,0.6)' }}>
            Attempt {attempts}
          </p>
        </div>

        {/* Help section */}
        <div className="p-4 rounded" style={{ background: 'rgba(184,117,42,0.07)', border: '1px solid rgba(184,117,42,0.2)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: '#B8752A' }}>📝 Steps</p>
          <ol className="text-[10px] space-y-1" style={{ color: '#8C7355', listStyleType: 'decimal', marginLeft: '20px' }}>
            <li>Dial {config.ussd}</li>
            <li>Enter merchant code: {config.merchantCode}</li>
            <li>Enter the amount: UGX {orderData?.total || '—'}</li>
            <li>Complete the transaction</li>
          </ol>
        </div>

        <button
          onClick={() => navigate('/shop', { replace: true })}
          className="w-full mt-6 py-2 text-xs tracking-widest uppercase"
          style={{ background: 'transparent', color: '#8C7355', border: '1px solid rgba(184,117,42,0.3)' }}
        >
          Cancel & Return to Shop
        </button>
      </div>
    </div>
  )
}
