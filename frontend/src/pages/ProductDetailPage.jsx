import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import { useCart } from '../context/CartContext'
import ProductImageCarousel from '../components/product/ProductImageCarousel'
import SizeSelector from '../components/product/SizeSelector'
import QuantityPicker from '../components/product/QuantityPicker'
import ItemListAccordion from '../components/product/ItemListAccordion'
import RelatedProducts from '../components/product/RelatedProducts'
import ProductReviews from '../components/product/ProductReviews'
import { ProductSEO } from '../components/shared/SEO'
import Button from '../components/shared/Button'
import { Package, UtensilsCrossed, MessageCircle, Lock } from 'lucide-react'

export default function ProductDetailPage() {
  const { slug }   = useParams()
  const navigate   = useNavigate()

  const [product,         setProduct]         = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity,        setQuantity]        = useState(1)
  const [added,           setAdded]           = useState(false)

  const { addItem, openDrawer } = useCart()

  useEffect(() => {
    setLoading(true)
    setProduct(null)
    setQuantity(1)

    api.get(`/products/${slug}`)
      .then(res => {
        const p = res.data.product
        setProduct(p)
        const def = p.variants?.find(v => v.is_default) ?? p.variants?.[0]
        setSelectedVariant(def ?? null)
      })
      .catch(() => navigate('/shop', { replace: true }))
      .finally(() => setLoading(false))
  }, [slug, navigate])

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return
    addItem(product, selectedVariant, quantity)
    openDrawer()
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const stockQty  = selectedVariant?.stock_qty ?? 0
  const isSoldOut = stockQty === 0
  const isLow     = stockQty > 0 && stockQty <= 3

  // ── Loading skeleton ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 animate-pulse">
          <div className="aspect-square bg-gray-200 skeleton rounded-2xl" />
          <div className="space-y-4 pt-2">
            <div className="h-5 bg-gray-200 skeleton rounded w-1/4" />
            <div className="h-9 bg-gray-200 skeleton rounded w-3/4" />
            <div className="h-5 bg-gray-200 skeleton rounded w-1/2" />
            <div className="h-7 bg-gray-200 skeleton rounded w-1/3" />
            <div className="h-20 bg-gray-200 skeleton rounded mt-4" />
            <div className="h-12 bg-gray-200 skeleton rounded-xl mt-4" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="bg-light min-h-screen">
      <ProductSEO product={product} />

      {/* Breadcrumb */}
      <div className="container mx-auto px-6 pt-6 pb-2">
        <nav className="flex items-center gap-2 text-xs text-gray-400">
          <Link to="/" className="hover:text-primary transition">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-primary transition">Shop</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link to={`/shop/${product.category.slug}`} className="hover:text-primary transition capitalize">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-dark line-clamp-1">{product.name}</span>
        </nav>
      </div>

      {/* Main product section */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Left: Images ── */}
          <div className="md:sticky md:top-24 self-start">
            <ProductImageCarousel images={product.images} productName={product.name} />
          </div>

          {/* ── Right: Info ── */}
          <div>
            {/* Badges */}
            <div className="flex gap-2 flex-wrap mb-4">
              {product.is_limited && (
                <span className="bg-dark text-primary text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                  Limited Edition
                </span>
              )}
              {product.is_featured && (
                <span className="bg-primary text-dark text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                  Featured
                </span>
              )}
              {isSoldOut && (
                <span className="bg-gray-200 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
                  Sold Out
                </span>
              )}
            </div>

            {/* Name + subtitle */}
            <h1 className="font-serif text-4xl font-bold text-dark leading-tight mb-1">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="text-gray-400 text-lg mb-4">{product.subtitle}</p>
            )}

            {/* Price */}
            <p className="text-3xl text-primary font-bold mb-5">
              UGX {Number(selectedVariant?.price ?? product.base_price).toLocaleString()}
            </p>

            {/* Description */}
            {product.description && (
              <p className="text-gray-600 leading-relaxed mb-6 text-base">
                {product.description}
              </p>
            )}

            {/* Size selector */}
            {product.variants?.length > 1 && (
              <SizeSelector
                variants={product.variants}
                selected={selectedVariant}
                onChange={v => { setSelectedVariant(v); setQuantity(1) }}
              />
            )}

            {/* Quantity */}
            {!isSoldOut && (
              <QuantityPicker quantity={quantity} onChange={setQuantity} />
            )}

            {/* Low stock */}
            {isLow && (
              <p className="text-sm text-amber-600 font-medium mb-3">
                ⚠ Only {stockQty} left in stock
              </p>
            )}

            {/* Add to cart */}
            <Button
              onClick={handleAddToCart}
              disabled={isSoldOut}
              variant={isSoldOut ? 'secondary' : 'primary'}
              className={`w-full rounded-2xl mb-4 text-base ${added ? 'bg-green-500 text-white hover:bg-green-500' : ''}`}
              size="lg"
            >
              {isSoldOut ? 'Sold Out' : added ? '✓ Added to Cart' : `Add to Cart — UGX ${Number(selectedVariant?.price ?? product.base_price).toLocaleString()}`}
            </Button>

            {/* Tasting notes */}
            {product.tasting_notes && (
              <div className="bg-dark text-light rounded-2xl p-5 mb-5">
                <p className="text-primary text-[10px] font-bold tracking-widest uppercase mb-2">
                  Tasting Notes
                </p>
                <p className="text-light/80 text-sm leading-relaxed italic font-serif text-base">
                  "{product.tasting_notes}"
                </p>
              </div>
            )}

            {/* What's in the box */}
            <ItemListAccordion items={product.items} />

            {/* Trust signals */}
            <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-2 gap-3">
              {[
                [Package,          'Same-day delivery in Kampala'],
                [UtensilsCrossed,  'Baked fresh daily'],
                [MessageCircle,    'WhatsApp order updates'],
                [Lock,             'Secure checkout'],
              ].map(([Icon, text]) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon size={14} className="text-primary flex-shrink-0" />
                  <span className="text-xs text-gray-400">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        <RelatedProducts categorySlug={product.category?.slug} currentId={product.id} />

        {/* Reviews */}
        <ProductReviews productSlug={product.slug} />
      </div>
    </div>
  )
}
