import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../context/CartContext'
import Crown from '../components/shared/Crown'
import { ShopSEO } from '../components/shared/SEO'
import { AlertTriangle } from 'lucide-react'

function ProductCard({ product }) {
  const { addItem, openDrawer } = useCart()
  const [adding, setAdding] = useState(false)

  const variant  = product.variants?.find(v => v.is_default) ?? product.variants?.[0]
  const price    = parseFloat(variant?.price ?? product.base_price ?? 0)
  const imgSrc   = product.images?.[0]?.url || product.primary_image || null
  const soldOut  = (variant?.stock_qty ?? 1) === 0

  const handleAdd = async () => {
    if (!variant || soldOut) return
    setAdding(true)
    addItem({ ...product, base_price: price }, { ...variant, price }, 1, { itemType: 'single' })
    openDrawer()
    setTimeout(() => setAdding(false), 800)
  }

  // Map slug to our local product images
  const localImgMap = {
    'venom':               '/images/products/venom.jpg',
    'coconut':             '/images/products/coconut.jpg',
    'crimson-sin':         '/images/products/crimson_sin.jpg',
    'campfire-after-dark': '/images/products/campfire.jpg',
    'blackout':            '/images/products/blackout.jpg',

  }
  const image = localImgMap[product.slug] || imgSrc

  return (
    <div className="group flex flex-col" style={{ background: '#1A0A00', border: '1px solid rgba(184,117,42,0.12)' }}>

      {/* Image */}
      <Link to={product.is_box_item ? "/build-your-box" : `/products/${product.slug}`} className="block relative overflow-hidden" style={{ aspectRatio: '1' }}>
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: '#2A1200' }}>
            <img src="/HAIQmain.png" alt="" className="w-16 h-16 object-contain opacity-20" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.is_limited && (
            <span className="text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest"
              style={{ background: 'rgba(168,85,247,0.85)', color: '#fff' }}>Limited</span>
          )}
          {soldOut && (
            <span className="text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest"
              style={{ background: 'rgba(239,68,68,0.85)', color: '#fff' }}>Sold Out</span>
          )}
          {product.is_box_item && (
            <span className="text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest"
              style={{ background: 'rgba(232,200,138,0.9)', color: '#1A0A00' }}>Special Box</span>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4">
        <Link to={`/products/${product.slug}`} style={{ textDecoration: 'none' }}>
          <p className="font-serif font-bold text-base leading-tight mb-0.5 hover:opacity-80 transition-opacity"
            style={{ color: '#F2EAD8' }}>{product.name}</p>
          <p className="text-[10px] mb-3" style={{ color: '#8C7355' }}>{product.subtitle}</p>
        </Link>

        <p className="text-[11px] leading-relaxed mb-4 flex-1 line-clamp-2"
          style={{ color: 'rgba(242,234,216,0.4)' }}>
          {product.tasting_notes || product.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <p className="font-bold text-sm" style={{ color: '#B8752A' }}>
            UGX {price.toLocaleString()}
          </p>

          <button
            onClick={handleAdd}
            disabled={soldOut || adding}
            className="text-[10px] font-bold tracking-[0.2em] uppercase px-4 py-2 transition-all disabled:opacity-40"
            style={{
              background: adding ? '#7A3B1E' : '#B8752A',
              color:      '#1A0A00',
              transform:  adding ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.2s',
            }}
          >
            {adding ? '✓ Added' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div style={{ background: '#1A0A00', border: '1px solid rgba(184,117,42,0.1)' }}>
      <div className="skeleton" style={{ aspectRatio: '1', background: 'rgba(184,117,42,0.06)' }} />
      <div className="p-4 space-y-2">
        <div className="h-4 skeleton rounded" style={{ width: '60%' }} />
        <div className="h-3 skeleton rounded" style={{ width: '40%' }} />
        <div className="h-3 skeleton rounded" style={{ width: '85%' }} />
      </div>
    </div>
  )
}

const TABS = [
  { key: 'all',           label: 'Cookies' },
  { key: 'drinks',        label: 'Drinks' },
  { key: 'build-your-box',label: 'Build Your Box' },
]

// Maps a tab key to the backend category slug to fetch
const TAB_CATEGORY = { all: 'cookies', drinks: 'drinks' }

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') || 'all'

  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [hasMore,  setHasMore]  = useState(false)
  const [page,     setPage]     = useState(1)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    setPage(1)
    setProducts([])
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'build-your-box') return
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({ page, limit: 12, category: TAB_CATEGORY[activeTab] || 'cookies' })
    api.get(`/products?${params}`)
      .then(res => {
        const incoming = res.data.products || []
        setProducts(prev => page === 1 ? incoming : [...prev, ...incoming])
        setHasMore(incoming.length === 12)
      })
      .catch(err => setError(err.message || 'Failed to load products'))
      .finally(() => setLoading(false))
  }, [page, activeTab])

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams)
    if (key === 'all') next.delete('tab')
    else next.set('tab', key)
    setSearchParams(next)
  }

  return (
    <div style={{ background: '#0E0600', minHeight: '100vh' }}>
      <ShopSEO />

      {/* Page header */}
      <div className="border-b py-16 md:py-20 px-6 md:px-16" style={{ borderColor: 'rgba(184,117,42,0.2)' }}>
        <Crown size={20} color="#B8752A" className="mb-5 opacity-65" />
        <h1
          className="font-serif font-bold leading-tight mb-3"
          style={{ fontSize: 'clamp(2.8rem, 7vw, 6rem)', color: '#F2EAD8' }}
        >
          The Collection.
        </h1>
        <div className="w-10 h-px mb-4" style={{ background: '#B8752A' }} />
        <p style={{ color: 'rgba(242,234,216,0.4)' }} className="text-base max-w-sm leading-relaxed">
          Six cookies. All handcrafted. All made for you.
        </p>
      </div>

      {/* Tabs */}
      <div className="px-6 md:px-16 py-6 border-b" style={{ borderColor: 'rgba(184,117,42,0.15)' }}>
        <div className="flex items-center gap-1 w-fit p-1" style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-5 py-2.5 text-sm font-semibold tracking-wide transition-all duration-200"
              style={{
                background: activeTab === t.key ? '#B8752A' : 'transparent',
                color:      activeTab === t.key ? '#1A0A00' : 'rgba(242,234,216,0.45)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 md:px-16 py-12">

        {/* Build Your Box redirect */}
        {activeTab === 'build-your-box' && (
          <div className="max-w-2xl mx-auto text-center py-12">
            <Crown size={28} color="#B8752A" className="mx-auto mb-6 opacity-60" />
            <h2 className="font-serif font-bold text-3xl md:text-5xl mb-4" style={{ color: '#F2EAD8' }}>
              Build Your Box.
            </h2>
            <div className="w-10 h-px mx-auto mb-5" style={{ background: '#B8752A' }} />
            <p className="text-base leading-relaxed mb-8 max-w-sm mx-auto" style={{ color: 'rgba(242,234,216,0.45)' }}>
              Choose exactly 4 cookies from our 5 flavours. Mix freely. Your call.
            </p>
            <Link
              to="/build-your-box"
              className="inline-block font-bold text-[11px] tracking-[0.28em] uppercase px-10 py-4 transition-all hover:opacity-90"
              style={{ background: '#B8752A', color: '#1A0A00' }}
            >
              Start Building →
            </Link>
          </div>
        )}

        {/* Product grid */}
        {(activeTab === 'all' || activeTab === 'drinks') && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {products.map(p => <ProductCard key={p.id} product={p} />)}
              {loading && Array(8).fill(null).map((_, i) => <SkeletonCard key={i} />)}
            </div>

            {!loading && error && (
              <div className="text-center py-20">
                <p className="font-serif text-2xl font-bold mb-2" style={{ color: '#F2EAD8' }}>
                  <AlertTriangle size={22} className="mx-auto mb-2" style={{ color: '#B8752A' }} />
                  Couldn't Load Products
                </p>
                <p style={{ color: '#8C7355' }} className="text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-3"
                  style={{ border: '1px solid rgba(184,117,42,0.5)', color: '#B8752A' }}
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && products.length === 0 && (
              <div className="text-center py-20">
                <p className="font-serif text-2xl font-bold mb-2" style={{ color: '#F2EAD8' }}>
                  Nothing here yet.
                </p>
                <p style={{ color: '#8C7355' }} className="text-sm">Check back after the next bake.</p>
              </div>
            )}

            {hasMore && !loading && (
              <div className="text-center mt-12">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="font-bold text-[11px] tracking-[0.2em] uppercase px-8 py-3 transition-all hover:opacity-90"
                  style={{ border: '1px solid rgba(184,117,42,0.5)', color: '#B8752A' }}
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
