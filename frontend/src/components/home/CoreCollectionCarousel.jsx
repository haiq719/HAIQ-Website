import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from '../product/ProductCard'
import ProductCardSkeleton from '../product/ProductCardSkeleton'
import api from '../../services/api'

export default function CoreCollectionCarousel() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [canLeft,  setCanLeft]  = useState(false)
  const [canRight, setCanRight] = useState(true)

  const scrollRef  = useRef(null)
  const isDragging = useRef(false)
  const startX     = useRef(0)
  const scrollLeft = useRef(0)

  useEffect(() => {
    api.get('/products?limit=12')
      .then(res => setProducts(res.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  const updateArrows = () => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 10)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10)
  }

  const scroll = (dir) => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' })
    setTimeout(updateArrows, 350)
  }

  // Drag-to-scroll
  const onMouseDown = (e) => {
    isDragging.current = true
    startX.current     = e.pageX - scrollRef.current.offsetLeft
    scrollLeft.current = scrollRef.current.scrollLeft
    scrollRef.current.style.cursor = 'grabbing'
  }
  const onMouseUp = () => {
    isDragging.current = false
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab'
  }
  const onMouseMove = (e) => {
    if (!isDragging.current) return
    e.preventDefault()
    const x    = e.pageX - scrollRef.current.offsetLeft
    const walk = (x - startX.current) * 1.2
    scrollRef.current.scrollLeft = scrollLeft.current - walk
    updateArrows()
  }

  return (
    <section className="py-20 bg-[#F5F0EA]">
      <div className="container mx-auto px-6">

        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-2">
              Our full range
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-dark">
              Core Collection
            </h2>
          </div>

          {/* Arrow controls */}
          <div className="flex gap-2">
            <button
              onClick={() => scroll('left')}
              disabled={!canLeft}
              aria-label="Scroll left"
              className="w-11 h-11 rounded-full border border-dark/20 flex items-center justify-center hover:bg-dark hover:text-light hover:border-dark transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canRight}
              aria-label="Scroll right"
              className="w-11 h-11 rounded-full border border-dark/20 flex items-center justify-center hover:bg-dark hover:text-light hover:border-dark transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Scroll track */}
        <div className="relative">
          {/* Left fade */}
          {canLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#F5F0EA] to-transparent z-10 pointer-events-none" />
          )}
          {/* Right fade */}
          {canRight && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#F5F0EA] to-transparent z-10 pointer-events-none" />
          )}

          <div
            ref={scrollRef}
            onScroll={updateArrows}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onMouseMove={onMouseMove}
            className="flex gap-5 overflow-x-auto pb-2 select-none"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              cursor: 'grab',
            }}
          >
            {loading
              ? Array(5).fill(null).map((_, i) => (
                  <div key={i} className="flex-none w-64">
                    <ProductCardSkeleton />
                  </div>
                ))
              : products.map((p, i) => (
                  <div key={p.id} className="flex-none w-64">
                    <ProductCard product={p} index={i} />
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </section>
  )
}
