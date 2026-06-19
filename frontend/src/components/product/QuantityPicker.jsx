import { Minus, Plus } from 'lucide-react'

export default function QuantityPicker({ quantity, onChange }) {
  return (
    <div className="mb-4">
      <label className="block font-medium mb-2">Quantity</label>
      <div className="flex items-center border rounded w-fit">
        <button onClick={() => onChange(quantity - 1)} disabled={quantity <= 1} className="px-3 py-2 border-r disabled:opacity-30" aria-label="Decrease quantity">
          <Minus size={14} />
        </button>
        <span className="px-4 py-1 tabular-nums">{quantity}</span>
        <button onClick={() => onChange(quantity + 1)} className="px-3 py-2 border-l" aria-label="Increase quantity">
          <Plus size={14} />
        </button>
      </div>
    </div>
  )
}