import { useState, useEffect } from 'react'
import api from '../services/api'
import { useCart } from '../context/CartContext'
import Crown from '../components/shared/Crown'
import Button from '../components/shared/Button'
import TimeWarning from '../components/TimeWarning'
import {
  getServerTime,
  getClientTime,
  calculateClockSkew,
  CLOCK_SKEW_TOLERANCE_SECONDS,
  addClientTimeHeader,
} from '../utils/timeSync'

const BOX_SIZE     = 4
const COOKIE_SLUGS = ['venom','coconut','crimson-sin','campfire-after-dark','blackout']
const LOCAL_IMGS = {
  'venom':               '/images/products/venom.jpg',
  'coconut':             '/images/products/coconut.jpg',
  'crimson-sin':         '/images/products/crimson_sin.jpg',
  'campfire-after-dark': '/images/products/campfire.jpg',
  'blackout':            '/images/products/blackout.jpg',
}

export default function BuildYourBoxPage() {
  const { addBox, openDrawer } = useCart()

  const [products,    setProducts]    = useState([])
  const [boxProduct,  setBoxProduct]  = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [selections,  setSelections]  = useState({})
  const [isSpecialDay,setIsSpecialDay]= useState(false)
  const [checkingDay, setCheckingDay] = useState(true)
  const [boxError,    setBoxError]    = useState(null)
  const [confirmed,   setConfirmed]   = useState(false)

  const [boxPrice, setBoxPrice] = useState(80000)
  const originalPrice = 80000
  const specialPrice  = 40000

  // Time validation state
  const [serverTime, setServerTime] = useState(null)
  const [clientTime, setClientTime] = useState(new Date())
  const [clockSkew, setClockSkew] = useState(0)
  const [showTimeWarning, setShowTimeWarning] = useState(false)

  const total     = Object.values(selections).reduce((s,n) => s+n, 0)
  const isFull    = total === BOX_SIZE
  const pct       = Math.round((total / BOX_SIZE) * 100)

  useEffect(() => {
    api.get('/special-days/active-today')
      .then(res => setIsSpecialDay(res.data.isSpecialDay === true || res.data.active === true))
      .catch(() => setIsSpecialDay(false))
      .finally(() => setCheckingDay(false))
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
          console.warn('[BuildYourBox] Clock skew detected:', { skewSeconds: skew })
        }
      } catch (error) {
        console.error('[BuildYourBox] Time sync initialization failed:', error)
      }
    }

    initializeTimeSync()
  }, [])

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.get('/products?limit=50')
      .then(res => {
        const cookies = (res.data.products || [])
          .filter(p => COOKIE_SLUGS.includes(p.slug) && p.is_active !== false)
          .sort((a,b) => COOKIE_SLUGS.indexOf(a.slug) - COOKIE_SLUGS.indexOf(b.slug))
        setProducts(cookies)
        return api.get('/products/box-office')
      })
      .then(boxRes => {
        const box = boxRes.data.product
        setBoxProduct(box)
        setBoxPrice(box.off_peak_price || 80000)
      })
      .catch(err => setError(err.message || 'Failed to load build options'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (boxProduct) {
      const newPrice = isSpecialDay ? (boxProduct.base_price || 40000) : (boxProduct.off_peak_price || 80000)
      setBoxPrice(newPrice)
    }
  }, [isSpecialDay, boxProduct])

  const add = (id) => { if (!isFull) setSelections(s => ({ ...s, [id]: (s[id]||0)+1 })) }
  const rem = (id) => {
    setSelections(s => {
      const n = { ...s, [id]: Math.max(0,(s[id]||0)-1) }
      if (n[id] === 0) delete n[id]
      return n
    })
  }

  const handleAddToCart = () => {
    if (!boxProduct) {
      setBoxError('Box product configuration missing. Please refresh the page.')
      return
    }
    const defaultVariant = boxProduct.variants?.find(v => v.is_default) ?? boxProduct.variants?.[0]
    if (!defaultVariant) {
      setBoxError('Box variant configuration missing. Please contact support.')
      return
    }
    setBoxError(null)

    // Refresh time check before adding to cart
    const currentClient = getClientTime()
    if (serverTime) {
      const newSkew = calculateClockSkew(serverTime, currentClient)
      setClockSkew(newSkew)

      // Show warning if time is off
      if (newSkew > CLOCK_SKEW_TOLERANCE_SECONDS) {
        setShowTimeWarning(true)
        setBoxError('Your system time appears to be incorrect. Please correct it before proceeding to checkout.')
        return
      }
    }

    const selectionsList = products
      .filter(p => (selections[p.id]||0) > 0)
      .map(p => {
        const variant = p.variants?.find(v => v.is_default) ?? p.variants?.[0]
        return { product: p, variant, count: selections[p.id] }
      })
    addBox(selectionsList, boxPrice, boxProduct.id, defaultVariant.id)

    // Show confirmation
    setConfirmed(true)
    setTimeout(() => setConfirmed(false), 2000)

    // Open drawer after a brief delay so user sees the button confirmation
    setTimeout(() => openDrawer(), 400)
  }

  return (
    <div style={{ background: '#0E0600', minHeight: '100vh' }}>

      <div className="border-b py-14 md:py-20 px-6 md:px-16" style={{ borderColor: 'rgba(184,117,42,0.2)' }}>
        <div className="flex items-center gap-3 mb-4">
          <Crown size={20} color="#B8752A" />
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase" style={{ color: '#B8752A' }}>
            Box Office
          </p>
        </div>
        <h1 className="font-serif font-bold leading-tight mb-3" style={{ fontSize: 'clamp(2.6rem,6.5vw,5.5rem)', color: '#F2EAD8' }}>
          Build Your Box.
        </h1>
        <div className="w-10 h-px mb-5" style={{ background: '#B8752A' }} />
        <p className="text-base max-w-sm leading-relaxed" style={{ color: 'rgba(242,234,216,0.45)' }}>
          Pick exactly 4 cookies. Any combination.
        </p>

        {!checkingDay && (
          <div className="mt-5 inline-flex items-center gap-3 px-4 py-2.5"
            style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.3)' }}>
            <p className="text-[10px] uppercase tracking-[0.25em] font-semibold" style={{ color: '#8C7355' }}>Box Price</p>
            {isSpecialDay ? (
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg line-through" style={{ color: '#8C7355' }}>UGX {originalPrice.toLocaleString()}</span>
                <p className="font-serif font-bold text-lg" style={{ color: '#E8C88A' }}>UGX {boxPrice.toLocaleString()}</p>
                <span className="text-[9px] font-bold px-2 py-0.5 uppercase tracking-wider"
                  style={{ background: '#B8752A', color: '#1A0A00' }}>Special Day</span>
              </div>
            ) : (
              <p className="font-serif font-bold text-lg" style={{ color: '#E8C88A' }}>
                UGX {boxPrice.toLocaleString()}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="sticky top-0 z-30 border-b"
        style={{ background: 'rgba(14,6,0,0.97)', borderColor: 'rgba(184,117,42,0.2)', backdropFilter: 'blur(8px)' }}>
        <div className="container mx-auto px-6 md:px-16 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <span className="font-bold text-sm" style={{ color: isFull ? '#E8C88A' : '#F2EAD8' }}>
                {total}<span className="font-normal" style={{ color: 'rgba(242,234,216,0.3)' }}> / {BOX_SIZE}</span>
              </span>
              {!isFull && <span className="text-xs" style={{ color: 'rgba(242,234,216,0.35)' }}>
                {BOX_SIZE - total} more {BOX_SIZE-total===1?'cookie':'cookies'} to go
              </span>}
              {isFull && <span className="text-xs font-semibold" style={{ color: '#E8C88A' }}>Box complete</span>}
            </div>
            {isFull && (
              <button
                onClick={handleAddToCart}
                disabled={!isFull || confirmed}
                className="px-6 py-2 font-bold text-xs uppercase tracking-[0.2em] transition-all duration-300"
                style={{
                  background: confirmed ? '#16a34a' : '#B8752A',
                  color: confirmed ? '#FFFFFF' : '#1A0A00',
                  borderRadius: '2px',
                  opacity: !isFull ? 0.5 : 1,
                  cursor: !isFull ? 'not-allowed' : 'pointer',
                  border: 'none',
                }}>
                {confirmed ? '✓ Added to Cart' : 'Add to Cart'}
              </button>
            )}
          </div>
          <div className="h-px overflow-hidden" style={{ background: 'rgba(184,117,42,0.15)' }}>
            <div className="h-full transition-all duration-300"
              style={{ width: `${pct}%`, background: isFull ? '#E8C88A' : '#B8752A' }} />
          </div>
          {boxError && (
            <div className="mt-2 text-xs px-3 py-2 rounded" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>
              {boxError}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 md:px-16 py-12">
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
                console.error('[BuildYourBox] Time sync refresh failed:', error)
              }
            }
            initializeTimeSync()
          }}
          variant="warning"
        />

        {error && !loading ? (
          <div className="text-center py-16">
            <p className="font-serif font-bold text-xl mb-2" style={{ color: '#F2EAD8' }}>⚠️ Couldn't Load Options</p>
            <p className="text-sm mb-6" style={{ color: '#8C7355' }}>{error}</p>
            <button onClick={() => window.location.reload()} className="font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-3"
              style={{ background: '#B8752A', color: '#1A0A00' }}>
              Try Again
            </button>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {Array(5).fill(null).map((_,i) => (
              <div key={i} className="aspect-square skeleton" style={{ background: 'rgba(184,117,42,0.06)' }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {products.map(p => {
              const count   = selections[p.id] || 0
              const soldOut = (p.variants?.[0]?.stock_qty ?? 1) === 0
              return (
                <div key={p.id}
                  className="group relative overflow-hidden transition-all duration-200"
                  style={{
                    background: '#1A0A00',
                    border:     `1px solid ${count > 0 ? '#B8752A' : 'rgba(184,117,42,0.15)'}`,
                    boxShadow:  count > 0 ? '0 0 20px rgba(184,117,42,0.15)' : 'none',
                    opacity:    soldOut ? 0.4 : 1,
                  }}>
                  <div className="overflow-hidden" style={{ aspectRatio: '1' }}>
                    <img src={LOCAL_IMGS[p.slug] || '/HAIQmain.png'} alt={p.name} loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  {count > 0 && (
                    <div className="absolute top-2 right-2 w-7 h-7 rounded-full font-bold text-sm flex items-center justify-center"
                      style={{ background: '#B8752A', color: '#1A0A00' }}>{count}</div>
                  )}
                  <div className="p-3">
                    <p className="font-serif font-bold text-sm leading-tight mb-0.5" style={{ color: '#F2EAD8' }}>{p.name}</p>
                    <p className="text-[10px] mb-3 line-clamp-1" style={{ color: '#8C7355' }}>{p.subtitle}</p>
                    <div className="flex items-center justify-between">
                      <button onClick={() => rem(p.id)} disabled={count===0}
                        className="w-8 h-8 flex items-center justify-center text-lg transition disabled:opacity-20"
                        style={{ border: '1px solid rgba(184,117,42,0.3)', color: '#F2EAD8' }}>-</button>
                      <span className="font-bold text-sm w-8 text-center" style={{ color: '#F2EAD8' }}>{count}</span>
                      <button onClick={() => add(p.id)} disabled={isFull || soldOut}
                        className="w-8 h-8 flex items-center justify-center text-lg transition disabled:opacity-20"
                        style={{ background: 'rgba(184,117,42,0.2)', border: '1px solid rgba(184,117,42,0.5)', color: '#B8752A' }}>+</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {isFull && (
        <div className="fixed bottom-0 left-0 right-0 z-40 py-4 px-6"
          style={{ background: '#1A0A00', borderTop: '1px solid rgba(184,117,42,0.4)' }}>
          <div className="container mx-auto max-w-2xl flex items-center justify-between gap-4">
            <div>
              <p className="font-bold text-sm" style={{ color: '#F2EAD8' }}>Your Box Office is ready.</p>
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: '#8C7355' }}>
                {Object.entries(selections).map(([id,count]) => {
                  const p = products.find(pr => pr.id === id)
                  return p ? `${count}x ${p.name}` : ''
                }).filter(Boolean).join(' · ')}
              </p>
            </div>
            <Button onClick={handleAddToCart} variant="primary" size="md" className="px-8 whitespace-nowrap">
              Add to Cart · UGX {boxPrice.toLocaleString()}
            </Button>
          </div>
        </div>
      )}
      {isFull && <div style={{ height: '80px' }} />}
    </div>
  )
}