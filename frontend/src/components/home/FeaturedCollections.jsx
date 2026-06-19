import { useState, useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import ProductCard from '../product/ProductCard'
import ProductCardSkeleton from '../product/ProductCardSkeleton'
import { Link } from 'react-router-dom'
import api from '../../services/api'

export default function FeaturedCollections() {
  const [products, setProducts] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    api.get('/products/featured')
      .then(res => setProducts(res.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="py-20 bg-light">
      <div className="container mx-auto px-6">

        {/* Section header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[0.2em] uppercase mb-2">
              Handpicked for you
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-dark">
              Featured Collections
            </h2>
          </div>
          <Link
            to="/shop"
            className="hidden md:inline-flex items-center gap-2 text-dark font-medium text-sm hover:text-primary transition group"
          >
            View all
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array(3).fill(null).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)
          }
        </div>

        {/* Mobile view-all link */}
        <div className="mt-8 text-center md:hidden">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 border border-dark text-dark px-6 py-3 rounded-full font-medium hover:bg-dark hover:text-light transition"
          >
            View all products <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}
