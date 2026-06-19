import { useState, useEffect } from 'react'
import { useCart } from '../../context/CartContext'
import { X, Minus, Plus, Check } from 'lucide-react'

export default function VariantPickerModal({ product, onClose }) {
  const [selectedVariant, setSelectedVariant] = useState(null)
  const [quantity,        setQuantity]        = useState(1)
  const [added,           setAdded]           = useState(false)

  const { addItem, openDrawer } = useCart()

  // Pre-select default variant
  useEffect(() => {
    const def = product?.variants?.find(v => v.is_default) ?? product?.variants?.[0]
    setSelectedVariant(def ?? null)
  }, [product])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!product) return null

  const stockQty  = selectedVariant?.stock_qty ?? 0
  const isSoldOut = stockQty === 0
  const maxQty    = Math.min(stockQty, 10)

  const handleAdd = () => {
    if (!selectedVariant || isSoldOut) return
    addItem(product, selectedVariant, quantity)
    openDrawer()
    setAdded(true)
    setTimeout(() => { setAdded(false); onClose() }, 1000)
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-dark/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal card */}
      <div className="relative bg-light rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden z-10">

        {/* Product image strip */}
        {product.images?.[0]?.url && (
          <div className="h-44 bg-[#F0EBE3] overflow-hidden">
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Product name + price */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-serif font-bold text-dark text-xl leading-tight">{product.name}</h3>
              {product.subtitle && (
                <p className="text-gray-400 text-sm mt-0.5">{product.subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-dark transition ml-2 flex-shrink-0"
              aria-label="Close"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Variant selector */}
          {product.variants?.length > 1 && (
            <div className="mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Choose Size</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map(v => {
                  const oos      = v.stock_qty === 0
                  const selected = selectedVariant?.id === v.id
                  return (
                    <button
                      key={v.id}
                      disabled={oos}
                      onClick={() => { setSelectedVariant(v); setQuantity(1) }}
                      className={`
                        px-4 py-2 rounded-xl border text-sm font-medium transition-all
                        ${oos
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed line-through'
                          : selected
                            ? 'border-dark bg-dark text-light'
                            : 'border-gray-200 text-dark hover:border-dark'
                        }
                      `}
                    >
                      {v.label}
                      {!oos && (
                        <span className={`ml-1.5 text-xs ${selected ? 'text-primary' : 'text-primary'}`}>
                          UGX {Number(v.price).toLocaleString()}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Price display */}
          <p className="text-2xl font-bold text-primary mb-4">
            UGX {Number(selectedVariant?.price ?? product.base_price).toLocaleString()}
          </p>

          {/* Quantity */}
          {!isSoldOut && (
            <div className="flex items-center gap-3 mb-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Qty</p>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-10 h-10 flex items-center justify-center text-dark hover:bg-gray-100 transition disabled:text-gray-300"
                  aria-label="Decrease quantity"
                >
                  <Minus size={15} />
                </button>
                <span className="w-10 text-center font-medium text-dark text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                  disabled={quantity >= maxQty}
                  className="w-10 h-10 flex items-center justify-center text-dark hover:bg-gray-100 transition disabled:text-gray-300"
                  aria-label="Increase quantity"
                >
                  <Plus size={15} />
                </button>
              </div>
              {selectedVariant?.stock_qty <= 3 && selectedVariant?.stock_qty > 0 && (
                <span className="text-xs text-amber-600 font-medium">
                  Only {selectedVariant.stock_qty} left
                </span>
              )}
            </div>
          )}

          {/* Add button */}
          <button
            onClick={handleAdd}
            disabled={isSoldOut || !selectedVariant}
            className={`
              w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-200
              ${isSoldOut
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : added
                  ? 'bg-green-500 text-white'
                  : 'bg-dark text-light hover:bg-primary hover:text-dark active:scale-[0.98]'
              }
            `}
          >
            {isSoldOut
              ? 'Sold Out'
              : added
                ? <span className="inline-flex items-center gap-1.5"><Check size={18} strokeWidth={2.5} /> Added to Cart!</span>
                : `Add to Cart — UGX ${Number((selectedVariant?.price ?? product.base_price) * quantity).toLocaleString()}`
            }
          </button>
        </div>
      </div>
    </div>
  )
}
