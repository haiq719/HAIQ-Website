import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import Button from '../components/shared/Button'
import TimeWarning from '../components/TimeWarning'
import {
  getServerTime,
  getClientTime,
  calculateClockSkew,
  CLOCK_SKEW_TOLERANCE_SECONDS,
  CRITICAL_SKEW_THRESHOLD,
  addClientTimeHeader,
} from '../utils/timeSync'

// Delivery notice instead of a hardcoded fee
const DELIVERY_NOTICE = 'Delivery pricing varies by location and will be confirmed by our team before dispatch. Estimated from UGX 5,000 within Kampala.'

// Payment methods configuration
const PAYMENT_METHODS = {
  mtn_momo: {
    label: 'MTN Mobile Money',
    code: '165',
    merchantCode: '170010',
    ussd: '*165*3#',
    logo: '/logos/mtn-logo.svg',
    color: '#FFD700',
    description: 'Dial *165*3# to complete payment',
  },
  airtel: {
    label: 'Airtel Money',
    code: '185',
    merchantCode: '100010',
    ussd: '*185*9#',
    logo: '/logos/airtel-logo.svg',
    color: '#DC143C',
    description: 'Dial *185*9# to complete payment',
  },
  cash_on_delivery: {
    label: 'Cash on Delivery',
    logo: '/logos/cod-logo.svg',
    description: 'Pay when your order arrives',
    color: '#8B7355',
  },
}

const containsHtml = (value = '') => /<[^>]*>/.test(value) || /javascript:/i.test(value)

function StepBar({ step }) {
  const steps = ['Order', 'Details', 'Payment', 'Confirm']
  return (
    <div className="flex items-center mb-10">
      {steps.map((label, i) => {
        const n = i + 1
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: step >= n ? '#B8752A' : 'rgba(61,32,0,0.6)',
                  color:      step >= n ? '#1A0A00' : '#8C7355',
                  border:     step === n ? '2px solid #E8C88A' : '2px solid transparent',
                }}>
                {step > n ? 'v' : n}
              </div>
              <p className="text-[9px] mt-1 hidden sm:block whitespace-nowrap"
                style={{ color: step === n ? '#B8752A' : '#8C7355' }}>{label}</p>
            </div>
            {i < steps.length-1 && (
              <div className="flex-1 h-px mx-2"
                style={{ background: step > n ? '#B8752A' : 'rgba(61,32,0,0.6)' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Box summary row — collapsible, no individual prices
function BoxSummaryRow({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mb-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <button onClick={() => setOpen(o => !o)} className="flex items-center gap-2 text-left">
            <p className="font-serif font-bold text-sm" style={{ color: '#F2EAD8' }}>{item.name}</p>
            <span className="text-[10px] transition-transform duration-200"
              style={{ color: '#8C7355', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}>v</span>
          </button>
          <p className="text-[10px] mt-0.5" style={{ color: '#8C7355' }}>Box of 4</p>
        </div>
        <p className="font-bold text-sm flex-shrink-0" style={{ color: '#B8752A' }}>
          UGX {(item.price).toLocaleString()}
        </p>
      </div>
      <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? '200px' : '0' }}>
        <div className="mt-2 space-y-1 pl-3"
          style={{ borderLeft: '2px solid rgba(184,117,42,0.25)', paddingLeft: '10px', paddingTop: '4px' }}>
          {item.boxContents?.map((c,i) => (
            <p key={i} className="text-[11px]" style={{ color: 'rgba(242,234,216,0.45)' }}>
              {c.quantity}x {c.name}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function OrderSummary({ items, subtotal, deliveryFee, total }) {
  return (
    <div className="sticky top-6 p-5" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.25em] mb-4" style={{ color: '#8C7355' }}>
        Order Summary
      </p>
      {items.map(item =>
        item.itemType === 'box'
          ? <BoxSummaryRow key={item.key} item={item} />
          : (
            <div key={item.key} className="flex justify-between mb-2">
              <p className="text-xs truncate pr-2" style={{ color: '#F2EAD8' }}>
                {item.quantity}x {item.name}
              </p>
              <p className="text-xs font-medium whitespace-nowrap" style={{ color: 'rgba(242,234,216,0.7)' }}>
                UGX {(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          )
      )}
      <div className="pt-3 mt-2" style={{ borderTop: '1px solid rgba(184,117,42,0.2)' }}>
        <div className="flex justify-between text-sm font-bold mb-2">
          <span style={{ color: '#F2EAD8' }}>Subtotal</span>
          <span style={{ color: '#E8C88A' }}>UGX {subtotal.toLocaleString()}</span>
        </div>
        {deliveryFee > 0 && (
          <div className="flex justify-between text-sm mb-2">
            <span style={{ color: '#8C7355' }}>Delivery</span>
            <span style={{ color: '#E8C88A' }}>UGX {deliveryFee.toLocaleString()}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold pt-2 mt-2" style={{ borderTop: '1px solid rgba(184,117,42,0.2)' }}>
          <span style={{ color: '#F2EAD8' }}>Total</span>
          <span style={{ color: '#B8752A' }}>UGX {total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}

function PayBtn({ method, selected, onSelect }) {
  const config = PAYMENT_METHODS[method]

  // DIAGNOSTIC: Check if payment method config exists
  console.log(`[PayBtn] method=${method}, config exists=${!!config}, available=${Object.keys(PAYMENT_METHODS).join(', ')}`)

  if (!config) {
    console.error(`[PayBtn] ERROR: No payment method config for "${method}". This will cause rendering to fail.`)
    return <div style={{ color: 'red', padding: '10px', border: '1px solid red' }}>Error: Payment method "{method}" not configured</div>
  }

  const isLogoMethod = config.logo !== undefined
  const isMobileMoneyMethod = method === 'mtn_momo' || method === 'airtel'
  
  return (
    <button onClick={() => onSelect(method)}
      className="w-full text-left transition-all overflow-hidden"
      style={{
        background: selected ? 'rgba(184,117,42,0.15)' : 'rgba(42,18,0,0.5)',
        border:     selected ? '2px solid #B8752A' : '1px solid rgba(61,32,0,0.8)',
        borderRadius: '12px',
      }}>
      <div className="p-4">
        <div className="flex items-center gap-4 mb-3">
          {isLogoMethod ? (
            <img src={config.logo} alt={config.label} className="h-12 w-auto object-contain bg-white rounded px-2 py-1" />
          ) : (
            <span className="text-4xl">{config.icon}</span>
          )}
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: '#F2EAD8' }}>{config.label}</p>
            <p className="text-[10px]" style={{ color: '#8C7355' }}>{config.description}</p>
          </div>
          <div className="w-5 h-5 rounded-full flex-shrink-0 transition-all flex items-center justify-center"
            style={{
              border:     `2px solid ${selected ? '#B8752A' : '#3D2000'}`,
              background: selected ? '#B8752A' : 'transparent',
            }}>
            {selected && <span style={{ color: '#1A0A00', fontSize: '12px', fontWeight: 'bold' }}>✓</span>}
          </div>
        </div>
        
        {isMobileMoneyMethod && (
          <div className="pl-2 pt-2 border-t border-opacity-20" style={{ borderColor: 'rgba(184,117,42,0.3)' }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#8C7355' }}>Merchant Code</p>
                <p className="text-sm font-bold font-mono mt-1" style={{ color: '#B8752A' }}>{config.merchantCode}</p>
              </div>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide" style={{ color: '#8C7355' }}>USSD Code</p>
                <p className="text-sm font-bold font-mono mt-1" style={{ color: '#B8752A' }}>{config.ussd}</p>
              </div>
            </div>
            <p className="text-[10px] mt-3 px-3 py-2 rounded" style={{ background: 'rgba(184,117,42,0.1)', color: '#8C7355' }}>
              📞 Dial <strong>{config.ussd}</strong> from your {config.label.split(' ')[0]} line to complete payment
            </p>
          </div>
        )}
      </div>
    </button>
  )
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { items, subtotal, toOrderItems, clearCart } = useCart()
  const [step, setStep] = useState(1)

  const [details, setDetails] = useState({
    first_name:       user?.first_name || (user?.full_name?.split(' ')[0] ?? ''),
    last_name:        user?.last_name  || (user?.full_name?.split(' ').slice(1).join(' ') ?? ''),
    email:            user?.email || '',
    phone:            user?.phone || '',
    delivery_address: '',
    delivery_note:    '',
  })
  const [payMethod,   setPayMethod]   = useState('')
  const [consent,     setConsent]     = useState(false)
  const [submitting,  setSubmitting]  = useState(false)
  const [submitError, setSubmitError] = useState(null)

  // Time validation state
  const [serverTime, setServerTime] = useState(null)
  const [clientTime, setClientTime] = useState(new Date())
  const [clockSkew, setClockSkew] = useState(0)
  const [showTimeWarning, setShowTimeWarning] = useState(false)

  // Delivery zones state
  const [zones, setZones] = useState([])
  const [selectedZone, setSelectedZone] = useState(null)
  const [zonesLoading, setZonesLoading] = useState(false)

  const upd = f => e => setDetails(d => ({ ...d, [f]: e.target.value }))

  // DIAGNOSTIC: Log step changes
  useEffect(() => {
    console.log(`[CheckoutPage] Step changed to: ${step}, payMethod: "${payMethod}", paymentValid: ${payMethod !== ''}`)
  }, [step, payMethod])

  // Fetch delivery zones on mount
  useEffect(() => {
    const fetchZones = async () => {
      setZonesLoading(true)
      try {
        const { data } = await api.get('/delivery-zones')
        if (data.success) {
          setZones(data.zones)
        }
      } catch (err) {
        console.error('Failed to fetch delivery zones:', err)
      } finally {
        setZonesLoading(false)
      }
    }
    fetchZones()
  }, [])

  // Initialize time synchronization on mount
  useEffect(() => {
    const initializeTimeSync = async () => {
      try {
        const server = await getServerTime()
        const client = getClientTime()
        const skew = calculateClockSkew(server, client)

        setServerTime(server)
        setClientTime(client)
        setClockSkew(skew)

        // Show warning if skew > 5 minutes
        if (skew > CLOCK_SKEW_TOLERANCE_SECONDS) {
          setShowTimeWarning(true)
          console.warn('[Checkout] Clock skew detected:', { skewSeconds: skew })
        }
      } catch (error) {
        console.error('[Checkout] Time sync initialization failed:', error)
      }
    }

    initializeTimeSync()
  }, [])

  useEffect(() => {
    // Wait for auth to finish loading, then redirect if not authenticated
    if (loading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    // Redirect if cart is empty
    if (items.length === 0) navigate('/shop', { replace: true })
  }, [items, loading, navigate, user])

  const detailsFields = [
    details.first_name,
    details.last_name,
    details.email,
    details.phone,
    details.delivery_address,
    details.delivery_note,
  ]

  const detailsValid =
    details.first_name.trim() && details.last_name.trim() &&
    details.email.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) &&
    details.phone.trim() && selectedZone && details.delivery_address.trim().length >= 5 &&
    !detailsFields.some(containsHtml)

  // Validation feedback for better UX - now returns array of all errors
  const getValidationErrors = () => {
    const errors = []
    if (!details.first_name.trim()) errors.push('First name is required')
    if (!details.last_name.trim()) errors.push('Last name is required')
    if (!details.email.trim()) errors.push('Email is required')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) errors.push('Invalid email format')
    if (!details.phone.trim()) errors.push('Phone number is required')
    if (!selectedZone) errors.push('Please select a delivery zone')
    if (details.delivery_address.trim().length < 5) errors.push('Delivery address must be at least 5 characters')
    if (detailsFields.some(containsHtml)) errors.push('Please remove HTML or script content')
    return errors
  }

  // Get validation error for display (first error)
  const validationError = getValidationErrors()[0] || null

  // Get all validation errors
  const validationErrors = getValidationErrors()

  // Helper to check if a specific field is invalid
  const isFieldInvalid = (field) => {
    switch(field) {
      case 'first_name': return !details.first_name.trim()
      case 'last_name': return !details.last_name.trim()
      case 'email': return !details.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)
      case 'phone': return !details.phone.trim()
      case 'delivery_zone': return !selectedZone
      case 'delivery_address': return details.delivery_address.trim().length < 5
      default: return false
    }
  }

  const deliveryFee = selectedZone ? parseFloat(selectedZone.price) : 0
  const total = subtotal + deliveryFee

  const paymentValid = payMethod !== ''

  const handleSubmit = async () => {
    if (!consent) { setSubmitError('Please confirm your agreement.'); return }
    if (detailsFields.some(containsHtml)) { setSubmitError('Please remove HTML or script content from the form.'); return }

    // Security: Check time synchronization before submitting order
    if (serverTime) {
      const currentClient = getClientTime()
      const newSkew = calculateClockSkew(serverTime, currentClient)
      setClockSkew(newSkew)

      // Block order if time is critically off (> 1 hour)
      if (newSkew > CRITICAL_SKEW_THRESHOLD) {
        setSubmitError('Your system time is incorrect. Please sync your device date and time and try again.')
        setShowTimeWarning(true)
        return
      }

      // Show warning if time is moderately off (5 minutes to 1 hour)
      if (newSkew > CLOCK_SKEW_TOLERANCE_SECONDS) {
        setShowTimeWarning(true)
      }
    }

    // DIAGNOSTIC — remove after fix confirmed
    const orderItems = toOrderItems();
    console.log('[checkout] items count:', orderItems.length);
    console.log('[checkout] items details:', orderItems);
    console.log('[checkout] payload preview:', {
      phone: details.phone,
      payment_method: payMethod,
      items_count: orderItems.length,
      consent_given: true,
    });
    // END DIAGNOSTIC

    setSubmitting(true); setSubmitError(null)
    try {
      const body = {
        first_name:       details.first_name.trim(),
        last_name:        details.last_name.trim(),
        email:            details.email.trim().toLowerCase(),
        phone:            details.phone.trim(),
        delivery_address: details.delivery_address.trim(),
        delivery_note:    details.delivery_note.trim() || undefined,
        delivery_zone_id: selectedZone?.id || null,
        items:            toOrderItems(),
        payment_method:   payMethod,
        consent_given:    true,
      }

      // Add client time header for server-side validation
      const headers = addClientTimeHeader()

      const { data } = await api.post('/orders', body, { headers })

      navigate(`/order-confirmation/${data.tracking_token || data.order?.tracking_token}`)
      clearCart()
    } catch (err) {
      const data = err.response?.data
      const details = data?.details
      if (details?.length) {
        const msgs = details.map(d => `${d.field ? d.field + ': ' : ''}${d.message}`).join(' • ')
        setSubmitError(`Validation failed — ${msgs}`)
      } else {
        setSubmitError(data?.error || data?.message || 'Something went wrong. Please try again.')
      }
    } finally { setSubmitting(false) }
  }

  if (items.length === 0) return null

  const inputSty = { background: '#1A0A00', border: '1px solid #3D2000', color: '#F2EAD8' }
  const inputCls = 'w-full px-4 py-3 text-sm focus:outline-none'
  const lbl = (text, req, fieldId) => (
    <label htmlFor={fieldId} className="block text-[10px] font-semibold uppercase tracking-[0.2em] mb-1.5" style={{ color: '#8C7355' }}>
      {text}{req && <span style={{ color: '#B8752A' }}> *</span>}
    </label>
  )

  // Accessibility IDs for delivery zone
  const zoneSelectId = 'delivery-zone-select'
  const zoneErrorId = 'delivery-zone-error'
  const zoneHelperId = 'delivery-zone-helper'

  return (
    <div style={{ background: '#0E0600', minHeight: '100vh' }}>
      <div className="flex items-center justify-between px-6 md:px-12 py-4"
        style={{ borderBottom: '1px solid rgba(184,117,42,0.2)', background: '#1A0A00' }}>
        <Link to="/"><img src="/HAIQmain.png" alt="HAIQ" className="h-9 w-auto" /></Link>
        <Link to="/shop" className="text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: '#8C7355' }}>Back to Shop</Link>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-10 max-w-5xl">
        <StepBar step={step} />

        {/* Time Validation Warning */}
        <TimeWarning
          skewSeconds={clockSkew}
          isVisible={showTimeWarning}
          onRefresh={() => {
            // Refresh time check
            const initializeTimeSync = async () => {
              try {
                const server = await getServerTime()
                const client = getClientTime()
                const skew = calculateClockSkew(server, client)
                setServerTime(server)
                setClientTime(client)
                setClockSkew(skew)
                if (skew <= CLOCK_SKEW_TOLERANCE_SECONDS) {
                  setShowTimeWarning(false)
                }
              } catch (error) {
                console.error('[Checkout] Time sync refresh failed:', error)
              }
            }
            initializeTimeSync()
          }}
          variant="warning"
        />

        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3 space-y-6">

            {/* Step 1 - Order Review */}
            {step === 1 && (
              <div>
                <h2 className="font-serif font-bold text-2xl mb-6" style={{ color: '#F2EAD8' }}>Review Your Order</h2>
                <div className="space-y-3 mb-8">
                  {items.map(item => (
                    item.itemType === 'box' ? (
                      <div key={item.key} className="p-4" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-serif font-bold text-sm" style={{ color: '#F2EAD8' }}>{item.name}</p>
                            <p className="text-[10px] mt-0.5" style={{ color: '#8C7355' }}>Box of 4 — tap to see contents</p>
                          </div>
                          <p className="font-bold text-base" style={{ color: '#B8752A' }}>
                            UGX {item.price.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div key={item.key} className="flex items-center gap-3 p-4"
                        style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
                        <div className="flex-1">
                          <p className="text-xs font-medium" style={{ color: '#F2EAD8' }}>{item.name}</p>
                          <p className="text-[10px]" style={{ color: '#8C7355' }}>Qty: {item.quantity}</p>
                        </div>
                        <p className="text-xs font-bold" style={{ color: '#B8752A' }}>
                          UGX {(item.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    )
                  ))}
                </div>
                <Button onClick={() => setStep(2)} variant="primary" className="w-full" size="lg">
                  Continue to Details
                </Button>
              </div>
            )}

            {/* Step 2 - Details */}
            {step === 2 && (
              <div>
                <h2 className="font-serif font-bold text-2xl mb-6" style={{ color: '#F2EAD8' }}>Your Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      {lbl('First Name',true)}
                      <input
                        className={inputCls}
                        style={{
                          ...inputSty,
                          borderColor: isFieldInvalid('first_name') ? '#f87171' : inputSty.borderColor,
                        }}
                        value={details.first_name}
                        onChange={upd('first_name')}
                      />
                    </div>
                    <div>
                      {lbl('Last Name',true)}
                      <input
                        className={inputCls}
                        style={{
                          ...inputSty,
                          borderColor: isFieldInvalid('last_name') ? '#f87171' : inputSty.borderColor,
                        }}
                        value={details.last_name}
                        onChange={upd('last_name')}
                      />
                    </div>
                  </div>
                  <div>
                    {lbl('Email',true)}
                    <input
                      type="email"
                      className={inputCls}
                      style={{
                        ...inputSty,
                        borderColor: isFieldInvalid('email') ? '#f87171' : inputSty.borderColor,
                      }}
                      value={details.email}
                      onChange={upd('email')}
                    />
                  </div>
                  <div>
                    {lbl('Phone',true)}
                    <input
                      type="tel"
                      className={inputCls}
                      style={{
                        ...inputSty,
                        borderColor: isFieldInvalid('phone') ? '#f87171' : inputSty.borderColor,
                      }}
                      value={details.phone}
                      onChange={upd('phone')}
                      placeholder="+256 700 000 000"
                    />
                  </div>
                  <div>
                    {lbl('Delivery Zone', true, zoneSelectId)}
                    <p id={zoneHelperId} className="text-[10px] mb-3" style={{ color: '#8C7355' }}>
                      Delivery fee varies by location. Select your zone below.
                    </p>
                    {zonesLoading ? (
                      <div className="text-xs py-3 px-4 rounded" style={{ background: 'rgba(184,117,42,0.1)', color: '#8C7355' }}>
                        ⏳ Loading delivery zones...
                      </div>
                    ) : (
                      <>
                        <select
                          id={zoneSelectId}
                          className={inputCls}
                          size={Math.min(7, Math.max(3, zones.length))}
                          style={{
                            ...inputSty,
                            borderColor: isFieldInvalid('delivery_zone') ? '#f87171' : inputSty.borderColor,
                            cursor: 'pointer',
                            transition: 'all 150ms ease-in-out',
                            paddingRight: '8px',
                            minHeight: '120px',
                          }}
                          value={selectedZone?.id || ''}
                          onChange={e => {
                            const zone = zones.find(z => z.id === e.target.value)
                            setSelectedZone(zone || null)
                          }}
                          onBlur={e => {
                            // Ensure state updates on blur if needed
                            if (e.target.value && !selectedZone) {
                              const zone = zones.find(z => z.id === e.target.value)
                              setSelectedZone(zone || null)
                            }
                            // Reset focus styling
                            e.target.style.borderColor = isFieldInvalid('delivery_zone') ? '#f87171' : '#3D2000'
                            e.target.style.backgroundColor = '#1A0A00'
                          }}
                          onFocus={e => {
                            // Highlight on focus
                            e.target.style.borderColor = '#B8752A'
                            e.target.style.backgroundColor = '#2A1200'
                          }}
                          aria-label="Select delivery zone"
                          aria-required="true"
                          aria-invalid={isFieldInvalid('delivery_zone')}
                          aria-describedby={`${zoneHelperId} ${isFieldInvalid('delivery_zone') ? zoneErrorId : ''}`}
                        >
                          {zones.map(zone => (
                            <option key={zone.id} value={zone.id}>
                              {zone.name} — UGX {zone.price.toLocaleString()}
                            </option>
                          ))}
                        </select>

                        {selectedZone && (
                          <div
                            className="mt-3 p-3 rounded"
                            style={{
                              background: 'rgba(184, 117, 42, 0.08)',
                              border: '1px solid rgba(184, 117, 42, 0.2)',
                            }}>
                            <p className="text-xs mb-1" style={{ color: '#F2EAD8' }}>
                              <span style={{ color: '#8C7355' }}>📍 Selected Zone:</span>{' '}
                              <strong>{selectedZone.name}</strong>
                            </p>
                            <p className="text-xs font-semibold" style={{ color: '#B8752A' }}>
                              💰 Delivery Fee: UGX {selectedZone.price.toLocaleString()}
                            </p>
                            <p className="text-[10px] mt-1.5" style={{ color: '#8C7355' }}>
                              ℹ️ Estimated delivery. Final amount confirmed before dispatch.
                            </p>
                          </div>
                        )}

                        {!selectedZone && validationErrors.length > 0 && validationErrors.find(e => e.includes('delivery zone')) && (
                          <p
                            id={zoneErrorId}
                            className="text-[10px] mt-3 px-3 py-2 rounded"
                            style={{
                              background: 'rgba(248, 113, 113, 0.15)',
                              border: '1px solid rgba(248, 113, 113, 0.3)',
                              color: '#f87171'
                            }}>
                            ⚠️ {validationErrors.find(e => e.includes('delivery zone'))}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div>
                    {lbl('Specific Address', true)}
                    <textarea
                      rows={2}
                      className={`${inputCls} resize-none`}
                      style={{
                        ...inputSty,
                        borderColor: isFieldInvalid('delivery_address') ? '#f87171' : inputSty.borderColor,
                      }}
                      value={details.delivery_address}
                      onChange={upd('delivery_address')}
                      placeholder="House number, landmark, building name..."
                    />
                  </div>
                  <div>{lbl('Delivery Note')}<input className={inputCls} style={inputSty} value={details.delivery_note} onChange={upd('delivery_note')} placeholder="Leave at gate / call on arrival"/></div>
                </div>
                {validationErrors.length > 0 && (
                  <div className="mb-4 p-4 rounded" style={{ background: 'rgba(248,113,113,0.15)', border: '2px solid #f87171' }}>
                    <p className="text-sm font-semibold mb-2" style={{ color: '#f87171' }}>
                      ⚠️ Please complete the following:
                    </p>
                    <ul className="space-y-1">
                      {validationErrors.map((error, i) => (
                        <li key={i} className="text-xs" style={{ color: '#f87171' }}>
                          • {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex gap-3 mt-6">
                  <Button onClick={() => setStep(1)} variant="secondary" className="flex-1" size="md">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!detailsValid} variant="primary" className="flex-1" size="md">
                    Continue to Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3 - Payment */}
            {step === 3 && (
              <div>
                <h2 className="font-serif font-bold text-2xl mb-6" style={{ color: '#F2EAD8' }}>Choose Payment Method</h2>
                <p className="text-sm mb-6" style={{ color: '#8C7355' }}>
                  Select how you'd like to pay for your order.
                </p>

                {/* DIAGNOSTIC: Log step 3 rendering */}
                {(() => {
                  console.log('[checkout step 3] Rendering payment methods section')
                  console.log('[checkout step 3] payMethod state:', payMethod)
                  console.log('[checkout step 3] Available methods:', Object.keys(PAYMENT_METHODS))
                  return null
                })()}

                <div className="space-y-4 mb-6">
                  <PayBtn method="cash_on_delivery" selected={payMethod === 'cash_on_delivery'} onSelect={setPayMethod} />
                </div>

                <div className="flex gap-3">
                  <Button onClick={() => setStep(2)} variant="secondary" className="flex-1" size="md">
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} disabled={!paymentValid} variant="primary" className="flex-1" size="md">
                    Review Order
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4 - Confirm */}
            {step === 4 && (
              <div>
                <h2 className="font-serif font-bold text-2xl mb-6" style={{ color: '#F2EAD8' }}>Confirm & Place Order</h2>
                <div className="space-y-3 mb-6">
                  <div className="p-4" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.15)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2" style={{ color: '#B8752A' }}>Delivery To</p>
                    <p className="text-sm" style={{ color: '#F2EAD8' }}>{details.first_name} {details.last_name}</p>
                    <p className="text-xs mt-1" style={{ color: '#8C7355' }}>{details.phone}</p>
                    {selectedZone && (
                      <p className="text-xs" style={{ color: '#8C7355' }}>{selectedZone.name}</p>
                    )}
                    <p className="text-xs" style={{ color: '#8C7355' }}>{details.delivery_address}</p>
                  </div>
                  <div className="p-4" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.15)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2" style={{ color: '#B8752A' }}>Payment</p>
                    <p className="text-sm capitalize" style={{ color: '#F2EAD8' }}>{payMethod.replace(/_/g,' ')}</p>
                  </div>
                  <div className="p-4" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.15)' }}>
                    <div className="flex justify-between text-sm font-bold">
                      <span style={{ color: '#F2EAD8' }}>Subtotal</span>
                      <span style={{ color: '#E8C88A' }}>UGX {subtotal.toLocaleString()}</span>
                    </div>
                    {deliveryFee > 0 && (
                      <div className="flex justify-between text-sm mt-2">
                        <span style={{ color: '#8C7355' }}>Delivery</span>
                        <span style={{ color: '#E8C88A' }}>UGX {deliveryFee.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2 mt-2" style={{ borderTop: '1px solid rgba(184,117,42,0.2)' }}>
                      <span style={{ color: '#F2EAD8' }}>Total</span>
                      <span style={{ color: '#B8752A' }}>UGX {total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <label className="flex items-start gap-3 mb-6 cursor-pointer">
                  <div onClick={() => setConsent(c => !c)}
                    className="w-5 h-5 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all"
                    style={{ background: consent ? '#B8752A' : 'transparent', border: `2px solid ${consent ? '#B8752A' : '#3D2000'}` }}>
                    {consent && <span style={{ color: '#1A0A00', fontSize: '11px', fontWeight: 'bold' }}>v</span>}
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: '#8C7355' }}>
                    I agree to HAIQ's{' '}
                    <a href="/terms" target="_blank" style={{ color: '#B8752A' }}>Terms of Use</a>{' '}and{' '}
                    <a href="/privacy" target="_blank" style={{ color: '#B8752A' }}>Privacy Policy</a>, and I consent to my personal data being processed for order fulfilment.
                  </p>
                </label>

                {submitError && (
                  <div className="mb-4 px-4 py-3 text-sm"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    {submitError}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={() => setStep(3)} variant="secondary" className="flex-1" size="md">
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting || !consent}
                    loading={submitting}
                    variant="primary"
                    className="flex-1"
                    size="md"
                  >
                    Confirm Order
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <OrderSummary items={items} subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
          </div>
        </div>
      </div>
    </div>
  )
}
