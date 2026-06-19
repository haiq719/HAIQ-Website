import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import Button from '../shared/Button'
import { ShoppingBag, X, ArrowRight, ChevronDown, Minus, Plus } from 'lucide-react'

// ── Box item — single row with collapsible cookie list ────────────────────────
function BoxCartItem({ item, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const lineTotal = item.price * item.quantity

  return (
    <div className="py-4" style={{ borderBottom: '1px solid rgba(184,117,42,0.12)' }}>
      <div className="flex items-start gap-3">

        {/* Thumbnail image */}
        <div
          className="w-14 h-14 flex-shrink-0 overflow-hidden rounded"
          style={{ background: '#2A1200', border: '1px solid rgba(184,117,42,0.2)' }}
        >
          <img
            src="/images/products/unboxing.jpg"
            alt="Box of cookies"
            className="w-full h-full object-cover"
            onError={e => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.parentElement.style.display = 'flex'
              e.currentTarget.parentElement.style.alignItems = 'center'
              e.currentTarget.parentElement.style.justifyContent = 'center'
            }}
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + price row */}
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-serif font-bold text-sm leading-snug" style={{ color: '#F2EAD8' }}>
                {item.name}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: '#8C7355' }}>Box of 4</p>
            </div>
            <p className="font-bold text-sm flex-shrink-0" style={{ color: '#B8752A' }}>
              UGX {lineTotal.toLocaleString()}
            </p>
          </div>

          {/* Expand toggle */}
          {item.boxContents?.length > 0 && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1.5 mt-2 transition-opacity hover:opacity-70"
              style={{ color: '#8C7355' }}
            >
              <span className="text-[10px] tracking-wide">
                {expanded ? 'Hide contents' : 'See what\'s inside'}
              </span>
              <span
                className="transition-transform duration-200 inline-flex"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <ChevronDown size={14} />
              </span>
            </button>
          )}

          {/* Cookie list — collapsible */}
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ maxHeight: expanded ? '200px' : '0' }}
          >
            <div className="mt-2 space-y-1 pl-0.5" style={{ borderLeft: '2px solid rgba(184,117,42,0.25)', paddingLeft: '10px', paddingTop: '4px' }}>
              {item.boxContents?.map((cookie, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: '#8C7355' }}>
                    {cookie.quantity}×
                  </span>
                  <span className="text-[10px]" style={{ color: 'rgba(242,234,216,0.55)' }}>
                    {cookie.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Remove */}
        <button
          onClick={() => onRemove(item)}
          className="text-xs flex-shrink-0 self-start mt-0.5 hover:opacity-60 transition-opacity"
          style={{ color: '#8C7355' }}
          aria-label={`Remove ${item.name}`}
        ><X size={15} strokeWidth={1.5} /></button>
      </div>
    </div>
  )
}

// ── Single cookie item ────────────────────────────────────────────────────────
function SingleCartItem({ item, onRemove, onQtyChange }) {
  const lineTotal = item.price * item.quantity

  return (
    <div className="flex gap-3 py-4" style={{ borderBottom: '1px solid rgba(184,117,42,0.12)' }}>
      <div className="w-14 h-14 flex-shrink-0 overflow-hidden" style={{ background: '#2A1200' }}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
          : <div className="w-full h-full flex items-center justify-center">
              <img src="/HAIQmain.png" alt="" className="w-7 h-7 object-contain opacity-20" loading="lazy" />
            </div>
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-serif font-bold text-sm leading-snug" style={{ color: '#F2EAD8' }}>{item.name}</p>
            {item.subtitle && <p className="text-[10px]" style={{ color: '#8C7355' }}>{item.subtitle}</p>}
          </div>
          <p className="font-bold text-sm flex-shrink-0" style={{ color: '#B8752A' }}>
            UGX {lineTotal.toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => onQtyChange(item, item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="w-5 h-5 flex items-center justify-center transition disabled:opacity-30"
            style={{ border: '1px solid rgba(184,117,42,0.3)', color: '#F2EAD8' }}
            aria-label="Decrease quantity"
          ><Minus size={12} /></button>
          <span className="text-xs font-medium w-4 text-center tabular-nums" style={{ color: '#F2EAD8' }}>
            {item.quantity}
          </span>
          <button
            onClick={() => onQtyChange(item, item.quantity + 1)}
            className="w-5 h-5 flex items-center justify-center transition"
            style={{ border: '1px solid rgba(184,117,42,0.3)', color: '#F2EAD8' }}
            aria-label="Increase quantity"
          ><Plus size={12} /></button>
        </div>
      </div>

      <button
        onClick={() => onRemove(item)}
        className="text-xs flex-shrink-0 self-start mt-0.5 hover:opacity-60 transition-opacity"
        style={{ color: '#8C7355' }}
        aria-label={`Remove ${item.name}`}
      ><X size={15} strokeWidth={1.5} /></button>
    </div>
  )
}

// ── Main CartDrawer ───────────────────────────────────────────────────────────
export default function CartDrawer({ isOpen, onClose }) {
  const { items, subtotal, itemCount, removeItem, updateQty, clearCart } = useCart()
  const isEmpty = items.length === 0

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-50 backdrop-blur-sm transition-opacity duration-300
          ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(26,10,0,0.75)' }}
      />

      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ background: '#1A0A00', borderLeft: '1px solid rgba(184,117,42,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(184,117,42,0.2)' }}>
          <div className="flex items-center gap-2">
            <h2 className="font-serif font-bold text-lg" style={{ color: '#F2EAD8' }}>Your Cart</h2>
            {itemCount > 0 && (
              <span className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#B8752A', color: '#1A0A00' }}>
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-xl leading-none transition hover:opacity-50"
            style={{ color: '#8C7355' }}
            aria-label="Close cart"
          ><X size={15} strokeWidth={1.5} /></button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <ShoppingBag size={36} style={{ color: 'rgba(184,117,42,0.35)' }} className="mb-4" />
              <p className="font-serif font-bold text-lg mb-1" style={{ color: '#F2EAD8' }}>Your cart is empty</p>
              <p className="text-sm mb-6" style={{ color: '#8C7355' }}>Add something delicious.</p>
              <button onClick={onClose} className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-[0.2em] uppercase hover:opacity-70 transition"
                style={{ color: '#B8752A' }}>
                Continue Shopping <ArrowRight size={13} />
              </button>
            </div>
          ) : (
            <div className="py-2">
              {items.map(item => (
                item.itemType === 'box'
                  ? <BoxCartItem key={item.key} item={item} onRemove={removeItem} />
                  : <SingleCartItem
                      key={item.key}
                      item={item}
                      onRemove={removeItem}
                      onQtyChange={(item, qty) => qty < 1 ? removeItem(item) : updateQty(item, qty)}
                    />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isEmpty && (
          <div className="flex-shrink-0 px-5 py-5 space-y-4"
            style={{ borderTop: '1px solid rgba(184,117,42,0.2)' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: '#8C7355' }}>Subtotal</p>
              <p className="font-bold text-base tabular-nums" style={{ color: '#F2EAD8' }}>
                UGX {subtotal.toLocaleString()}
              </p>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: '#8C7355' }}>
              Delivery (UGX 5,000) added at checkout.
            </p>
            <Button
              as="link"
              to="/checkout"
              onClick={onClose}
              className="w-full py-3.5 text-[11px]"
            >
              Checkout — UGX {subtotal.toLocaleString()}
            </Button>
            <button
              onClick={() => { clearCart(); onClose() }}
              className="w-full text-[10px] tracking-wide transition hover:opacity-50"
              style={{ color: '#8C7355' }}
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  )
}
