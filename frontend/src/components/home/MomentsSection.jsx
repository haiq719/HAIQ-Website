import { useRef, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Crown from '../shared/Crown'

const MOMENTS = [
  { src: '/images/moments/moment_01.jpg', caption: 'The Blackout. Undivided attention.' },
  { src: '/images/moments/moment_02.jpg', caption: 'Every bite, deliberate.' },
  { src: '/images/moments/moment_03.jpg', caption: 'Made for moments like this.' },
  { src: '/images/moments/moment_04.jpg', caption: 'Venom. Everywhere she goes.' },
  { src: '/images/moments/moment_05.jpg', caption: 'Slow down. Taste it.' },
  { src: '/images/moments/moment_06.jpg', caption: 'She came for one. Stayed for four.' },
  { src: '/images/moments/moment_07.jpg', caption: 'Kampala tastes better now.' },
]

function MomentCard({ moment, className = '' }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.08 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`
        group relative overflow-hidden bg-dark2 cursor-pointer
        transition-all duration-700
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
        ${className}
      `}
    >
      <img
        src={moment.src}
        alt={moment.caption}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />

      {/* Bugatti caption overlay — slides up on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark/80 via-dark/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 px-4 py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-light text-xs font-medium tracking-wide leading-snug">{moment.caption}</p>
      </div>

      {/* Thin border on hover */}
      <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/40 transition-all duration-300 pointer-events-none" />
    </div>
  )
}

export default function MomentsSection() {
  const [headerRef, setHeaderRef] = useState(null)
  const [headerVisible, setHeaderVisible] = useState(false)

  useEffect(() => {
    if (!headerRef) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setHeaderVisible(true) },
      { threshold: 0.1 }
    )
    obs.observe(headerRef)
    return () => obs.disconnect()
  }, [headerRef])

  return (
    <section className="bg-dark py-24 md:py-32">
      {/* Bugatti top rule */}
      <div className="h-px bg-primary/20" />

      <div className="container mx-auto px-6 md:px-16 pt-16">

        {/* Header */}
        <div
          ref={setHeaderRef}
          className={`mb-12 transition-all duration-700 ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
        >
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Crown size={18} color="#B8752A" />
                <p className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase">
                  Moments
                </p>
              </div>
              <h2
                className="font-serif font-bold text-light leading-tight"
                style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)' }}
              >
                Made For<br />Real People.
              </h2>
              <div className="w-10 h-px bg-primary mt-5" />
            </div>

            <Link
              to="/moments"
              className="hidden md:flex items-center gap-2 text-primary text-[11px] font-semibold tracking-[0.25em] uppercase hover:text-secondary transition-colors flex-shrink-0 mb-2"
            >
              See All <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {/* ── Bugatti asymmetric grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">

          {/* First card spans 2 cols + 2 rows — asymmetric hero moment */}
          <div className="col-span-2 row-span-2">
            <MomentCard moment={MOMENTS[0]} className="h-full min-h-[320px] md:min-h-[460px]" />
          </div>

          {/* Remaining cards */}
          {MOMENTS.slice(1, 5).map((m, i) => (
            <MomentCard
              key={i}
              moment={m}
              className="aspect-square"
            />
          ))}

          {/* Wide card at bottom */}
          <div className="col-span-2 md:col-span-1">
            <MomentCard moment={MOMENTS[5]} className="h-full min-h-[200px]" />
          </div>
          <MomentCard moment={MOMENTS[6]} className="aspect-square" />
        </div>

        {/* Mobile see all */}
        <div className="mt-8 md:hidden text-center">
          <Link
            to="/moments"
            className="inline-flex items-center gap-1.5 text-primary text-[11px] font-semibold tracking-[0.25em] uppercase hover:text-secondary transition-colors"
          >
            See All Moments <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Bugatti bottom rule */}
      <div className="h-px bg-primary/20 mt-16" />
    </section>
  )
}
