import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import Crown from '../shared/Crown'

const SPECS = [
  { label: 'Flavours', value: '6'         },
  { label: 'Per Pack', value: '4 Cookies' },
  { label: 'Price',    value: 'UGX 5,000' },
  { label: 'City',     value: 'Kampala'   },
]

export default function HeroSection() {
  const [loaded,  setLoaded]  = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80)
    return () => clearTimeout(t)
  }, [])

  const show = (delay = 0) => ({
    opacity:    loaded ? 1 : 0,
    transform:  loaded ? 'translateY(0)' : 'translateY(28px)',
    transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
  })

  const handlePress = () => {
    setPressed(true)
    setTimeout(() => setPressed(false), 600)
  }

  return (
    <section className="relative h-screen min-h-[640px] overflow-hidden" style={{ background: '#1A0A00' }}>

      {/* Solid dark fill */}
      <div className="absolute inset-0" style={{ background: '#1A0A00' }} />

      {/* Subtle noise grain */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '180px 180px',
        }}
      />

      {/* Thin top rule */}
      <div className="absolute top-0 left-0 right-0 z-20" style={{ height: '1px', background: 'rgba(184,117,42,0.3)' }} />

      {/* Main content — pb reserves space so spec strip never overlaps */}
      <div className="relative z-10 h-full flex flex-col md:pb-[104px]">

        {/* Top meta row */}
        <div className="flex items-center justify-between px-8 md:px-20 pt-28 md:pt-32" style={show(0)}>
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase" style={{ color: 'rgba(184,117,42,0.55)' }}>
            Kampala · Uganda
          </p>
          <div
            className="hidden md:flex flex-col items-center justify-center w-14 h-14"
            style={{ border: '1px solid rgba(184,117,42,0.25)' }}
          >
            <span className="text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: '#B8752A' }}>Est</span>
            <span className="font-serif text-lg font-bold leading-none" style={{ color: '#F2EAD8' }}>19</span>
            <span className="text-[8px] font-bold tracking-[0.2em] uppercase" style={{ color: '#B8752A' }}>2019</span>
          </div>
        </div>

        {/* Centre — headline + CTAs */}
        <div className="flex-1 flex items-center px-8 md:px-20">
          <div className="max-w-3xl">

            <div style={show(60)} className="mb-5">
              <Crown size={26} color="#B8752A" />
            </div>

            <h1
              className="font-serif font-bold leading-[0.93] mb-6"
              style={{
                fontSize: 'clamp(3rem, min(9.5vw, 13vh), 8.5rem)',
                color: '#F2EAD8',
                ...show(100),
              }}
            >
              Made<br />
              <span style={{ color: '#B8752A' }}>For You.</span>
            </h1>

            <div className="w-14 h-px mb-6" style={{ background: '#B8752A', ...show(180) }} />

            <p
              className="text-base md:text-lg leading-relaxed max-w-xs md:max-w-sm mb-10"
              style={{ color: 'rgba(242,234,216,0.55)', ...show(220) }}
            >
              Handcrafted cookies. Baked fresh every morning in Kampala.
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-6 flex-wrap" style={show(280)}>

              <Link
                to="/shop"
                onClick={handlePress}
                className="relative inline-flex items-center justify-center overflow-hidden font-bold text-[11px] tracking-[0.28em] uppercase"
                style={{
                  padding:    '14px 36px',
                  background: pressed ? '#7A3B1E' : '#B8752A',
                  color:      '#1A0A00',
                  transition: 'background 0.15s ease, transform 0.15s ease, box-shadow 0.3s ease',
                  transform:  pressed ? 'scale(0.96)' : 'scale(1)',
                  boxShadow:  pressed
                    ? '0 0 0 4px rgba(184,117,42,0.25), 0 0 30px rgba(184,117,42,0.4)'
                    : '0 0 0 0px transparent',
                }}
                onMouseEnter={e => {
                  if (!pressed) {
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(184,117,42,0.5), 0 0 40px rgba(184,117,42,0.35)'
                    e.currentTarget.style.background = '#C8852A'
                  }
                }}
                onMouseLeave={e => {
                  if (!pressed) {
                    e.currentTarget.style.boxShadow = '0 0 0 0px transparent'
                    e.currentTarget.style.background = '#B8752A'
                  }
                }}
              >
                <span className="relative z-10">Order Now</span>
                {pressed && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping"
                    style={{ background: 'rgba(232,200,138,0.3)' }}
                  />
                )}
              </Link>

              <Link
                to="/build-your-box"
                className="flex items-center gap-2 font-semibold text-[11px] tracking-[0.25em] uppercase transition-all duration-200 hover:gap-3"
                style={{ color: 'rgba(242,234,216,0.5)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#B8752A'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(242,234,216,0.5)'}
              >
                Build Your Box
                <ArrowRight size={15} style={{ color: '#B8752A' }} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Spec strip — absolutely at bottom, outside the flex flow so it never compresses content */}
      <div
        className="hidden md:block absolute bottom-0 left-0 right-0 z-10 px-20 pb-10"
        style={show(400)}
      >
        <div className="w-full mb-6" style={{ height: '1px', background: 'rgba(184,117,42,0.15)' }} />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0">
            {SPECS.map(({ label, value }, i) => (
              <div
                key={label}
                className="px-6"
                style={{ borderLeft: i === 0 ? 'none' : '1px solid rgba(184,117,42,0.2)' }}
              >
                <p className="text-[9px] font-semibold tracking-[0.28em] uppercase mb-1"
                  style={{ color: 'rgba(184,117,42,0.5)' }}>
                  {label}
                </p>
                <p className="text-sm font-bold" style={{ color: 'rgba(242,234,216,0.8)' }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-px h-10 relative overflow-hidden" style={{ background: 'rgba(242,234,216,0.1)' }}>
              <div
                className="absolute top-0 w-full h-1/2"
                style={{ background: '#B8752A', animation: 'scrollDot 1.8s ease-in-out infinite' }}
              />
            </div>
            <span className="text-[9px] tracking-[0.25em] uppercase" style={{ color: 'rgba(242,234,216,0.2)' }}>Scroll</span>
          </div>
        </div>
      </div>

      {/* Thin bottom rule */}
      <div className="absolute bottom-0 left-0 right-0 z-20" style={{ height: '1px', background: 'rgba(184,117,42,0.2)' }} />
    </section>
  )
}
