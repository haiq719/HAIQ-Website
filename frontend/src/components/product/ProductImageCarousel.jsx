import { useState } from 'react'

export default function ProductImageCarousel({ images, productName = 'Product' }) {
  const [mainImage, setMainImage] = useState(images?.[0]?.url || '/placeholder-product.webp')
  const [mainAlt,   setMainAlt]   = useState(images?.[0]?.alt_text || productName)

  if (!images || images.length === 0) {
    return (
      <img
        src="/placeholder-product.webp"
        alt={productName}
        className="w-full rounded-lg"
        loading="lazy"
      />
    )
  }

  return (
    <div>
      {/* Main image — NOT lazy (it's above the fold on product page) */}
      <img
        src={mainImage}
        alt={mainAlt}
        className="w-full rounded-lg mb-4"
        fetchpriority="high"
      />

      {/* Thumbnail strip — lazy loaded */}
      {images.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setMainImage(img.url); setMainAlt(img.alt_text || productName) }}
              className="flex-none w-20 h-20 border-2 rounded overflow-hidden hover:border-primary"
              aria-label={`View image ${idx + 1} of ${images.length}`}
            >
              <img
                src={img.url}
                alt={img.alt_text || `${productName} — view ${idx + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
