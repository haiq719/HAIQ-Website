import { Link } from 'react-router-dom'
import { useRef, useEffect, useState } from 'react'
import Crown from '../shared/Crown'
import { UtensilsCrossed, Package, Crown as CrownIcon } from 'lucide-react'

export default function CTASection() {
  const [ref, setRef] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    obs.observe(ref)
    return () => obs.disconnect()
  }, [ref])

  return (
    <section className="relative bg-dark overflow-hidden py-24 md:py-40">
      {/* Bugatti rules */}
      <div className="absolute top-0 left-0 right-0 h-px bg-primary/30" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-primary/30" />

      {/* Vertical lines */}
      <div className="absolute top-0 bottom-0 left-[7%] w-px bg-primary/10 hidden md:block" />
      <div className="absolute top-0 bottom-0 right-[7%] w-px bg-primary/10 hidden md:block" />

      <div
        ref={setRef}
        className={`
          container mx-auto px-6 md:px-16 text-center
          transition-all duration-700
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        `}
      >
        <Crown size={28} color="#B8752A" className="mx-auto mb-8 opacity-60" />

        <p className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase mb-5">
          Made For You
        </p>

        <h2
          className="font-serif font-bold text-light leading-[0.92] mb-8"
          style={{ fontSize: 'clamp(3rem, 7.5vw, 7rem)' }}
        >
          Ready When<br />You Are.
        </h2>

        <div className="w-12 h-px bg-primary mx-auto mb-8" />

        <p className="text-light/45 max-w-md mx-auto text-base leading-relaxed mb-12">
          Four cookies. Six flavours. One bakery in Kampala
          that takes every order personally.
        </p>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-10 md:gap-16 mb-14 flex-wrap">
          {[
            { Icon: UtensilsCrossed, label: 'Baked Fresh Daily' },
            { Icon: Package,         label: 'Same-Day Delivery' },
            { Icon: CrownIcon,       label: 'Loyalty Rewards'   },
          ].map(({ Icon, label }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon size={16} style={{ color: '#B8752A' }} />
              <span className="text-light/50 text-xs font-medium tracking-wide">{label}</span>
            </div>
          ))}
        </div>

        {/* Squared-off CTAs */}
        <div className="flex items-center justify-center gap-5 flex-wrap">
          <Link
            to="/shop"
            className="group relative bg-primary text-dark px-10 py-4 font-bold text-[11px] tracking-[0.25em] uppercase overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_rgba(184,117,42,0.5)]"
          >
            <span className="relative z-10">Order Now</span>
            <div className="absolute inset-0 bg-secondary translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
          </Link>

          <Link
            to="/build-your-box"
            className="border border-primary/50 text-primary px-10 py-4 font-bold text-[11px] tracking-[0.25em] uppercase hover:bg-primary hover:text-dark transition-all duration-300"
          >
            Build Your Box
          </Link>
        </div>
      </div>
    </section>
  )
}
