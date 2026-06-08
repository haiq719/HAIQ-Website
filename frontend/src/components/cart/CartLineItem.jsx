import { useCart } from '../../context/CartContext'

export default function CartLineItem({ item }) {
  const { updateQuantity, removeItem } = useCart()

  return (
    <div className="flex py-4 border-b border-gray-100 last:border-0">
      <img
        src={item.image}
        alt={item.name}
        className="w-16 h-16 object-cover rounded flex-shrink-0"
        loading="lazy"
        onError={e => { e.target.src = '/placeholder-product.webp' }}
      />
      <div className="ml-4 flex-1 min-w-0">
        <h4 className="font-bold text-sm truncate">{item.name}</h4>
        <p className="text-xs text-gray-500">{item.variantLabel}</p>

        <div className="flex items-center justify-between mt-2">
          {/* Quantity control */}
          <div className="flex items-center border rounded overflow-hidden">
            <button
              onClick={() => {
                // ✅ Fixed: decrementing to 0 calls removeItem instead of setting qty=0
                if (item.quantity <= 1) {
                  removeItem(item.variantId)
                } else {
                  updateQuantity(item.variantId, item.quantity - 1)
                }
              }}
              className="px-2 py-1 hover:bg-gray-100 transition text-sm"
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="px-3 text-sm">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
              className="px-2 py-1 hover:bg-gray-100 transition text-sm"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>

          <span className="font-medium text-sm">
            UGX {(item.price * item.quantity).toLocaleString()}
          </span>
        </div>

        <button
          onClick={() => removeItem(item.variantId)}
          className="text-xs text-red-400 hover:text-red-600 mt-1 transition"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
