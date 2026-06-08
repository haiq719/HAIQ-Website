import Crown from '../components/shared/Crown'
import { MomentsSEO } from '../components/shared/SEO'

const ALL_MOMENTS = [
  { src: '/images/moments/moment_01.jpg', caption: 'The Blackout. Undivided attention.',       sub: 'Kampala, 2025' },
  { src: '/images/moments/moment_02.jpg', caption: 'Every bite, deliberate.',                  sub: 'Made For You'  },
  { src: '/images/moments/moment_03.jpg', caption: 'Made for moments like this.',              sub: 'Kampala, 2025' },
  { src: '/images/moments/moment_04.jpg', caption: 'Venom. Everywhere she goes.',              sub: 'Muyenga'       },
  { src: '/images/moments/moment_05.jpg', caption: 'Slow down. Taste it.',                    sub: 'Made For You'  },
  { src: '/images/moments/moment_06.jpg', caption: 'She came for one. Stayed for four.',      sub: 'Kampala, 2025' },
  { src: '/images/moments/moment_07.jpg', caption: 'Kampala tastes better now.',              sub: 'Made For You'  },
  { src: '/images/moments/moment_08.jpg', caption: 'Open hand. Open smile.',                  sub: 'Kampala, 2025' },
  { src: '/images/moments/moment_09.jpg', caption: 'Build Your Box. Right on time.',            sub: 'Made For You'  },
  { src: '/images/moments/moment_10.jpg', caption: 'Open it. Own it.',                        sub: 'Kampala, 2025' },
]

function MomentCard({ moment }) {
  return (
    <div className="break-inside-avoid group relative overflow-hidden mb-3 bg-dark2">
      <img
        src={moment.src}
        alt={moment.caption}
        loading="lazy"
        className="w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />
      {/* Caption overlay — Bugatti slide-up on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-dark/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 px-4 py-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
        <p className="text-light text-sm font-medium leading-snug">{moment.caption}</p>
        <p className="text-primary text-[10px] tracking-[0.25em] uppercase mt-1">{moment.sub}</p>
      </div>
      <div className="absolute inset-0 border border-primary/0 group-hover:border-primary/30 transition-all duration-300 pointer-events-none" />
    </div>
  )
}

export default function MomentsPage() {
  return (
    <div className="bg-dark min-h-screen">
      <MomentsSEO />

      {/* Hero header */}
      <div className="border-b border-primary/20 py-20 md:py-28 px-6 md:px-16">
        <Crown size={22} color="#B8752A" className="mb-5 opacity-65" />
        <p className="text-primary text-[10px] font-semibold tracking-[0.3em] uppercase mb-3">
          Made For You
        </p>
        <h1
          className="font-serif font-bold text-light leading-tight mb-4"
          style={{ fontSize: 'clamp(3.2rem, 8vw, 7rem)' }}
        >
          Moments.
        </h1>
        <div className="w-10 h-px bg-primary mb-5" />
        <p className="text-light/45 max-w-xs text-base leading-relaxed">
          Real people. Real cookies. Real Kampala.
        </p>
      </div>

      {/* Masonry grid */}
      <div className="px-6 md:px-16 py-14">
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3">
          {ALL_MOMENTS.map((m, i) => (
            <MomentCard key={i} moment={m} />
          ))}
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="border-t border-primary/20 py-16 px-6 text-center">
        <Crown size={22} color="#B8752A" className="mx-auto mb-4 opacity-40" />
        <p className="text-light/40 text-sm mb-6 tracking-wide">
          Be part of the next moment.
        </p>
        <a
          href="/shop"
          className="inline-block bg-primary text-dark px-10 py-4 font-bold text-[11px] tracking-[0.25em] uppercase hover:bg-secondary transition-colors duration-300"
        >
          Order Now
        </a>
      </div>
    </div>
  )
}
