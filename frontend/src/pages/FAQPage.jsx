import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Crown from '../components/shared/Crown'
import { FAQSeo } from '../components/shared/SEO'

const FAQ_SECTIONS = [
  {
    section: 'About the Cookies',
    items: [
      {
        q: 'Do you have weed cookies?',
        a: 'No. We don\'t. Not a thing here. HAIQ cookies are exactly what they say they are — premium handcrafted cookies baked in Kampala. The only thing dangerous about them is how quickly they disappear.',
      },
      {
        q: 'How many cookies come in a pack?',
        a: 'Every pack contains exactly 4 cookies. Build Your Box also contains 4 — individually wrapped inside a signature black box. Always 4. Non-negotiable.',
      },
      {
        q: 'Are the cookies made fresh?',
        a: 'Every single morning. We bake to order — no shelf sitting, no day-old batches. If you order before noon, your cookies were likely baked that same morning.',
      },
    ],
  },
  {
    section: 'Ordering & Delivery',
    items: [
      {
        q: 'Is delivery free?',
        a: 'No. Delivery is a real service with real people — we charge UGX 5,000 within Kampala. We think that\'s fair for something baked fresh that morning and brought to your door.',
      },
      {
        q: 'How long does delivery take?',
        a: 'Same-day within Kampala for orders placed before noon. We\'ll send you updates at every step so you\'re never left wondering where your cookies are.',
      },
      {
        q: 'Can I change my delivery address after ordering?',
        a: 'If the order hasn\'t left our kitchen yet, yes — reach out immediately via the contact page or WhatsApp. Once it\'s on its way, we can\'t redirect it.',
      },
    ],
  },
  {
    section: 'Pricing & Offers',
    items: [
      {
        q: 'Do you give discounts?',
        a: 'No. We don\'t do discounts. The price is the price because we don\'t cut corners on what goes inside. What you pay reflects what you get — nothing inflated, nothing skimped.',
      },
      {
        q: 'Why does Build Your Box cost more on certain days?',
        a: 'Build Your Box is a signature gift box only available on special occasions — holidays, celebrations, and days we designate. On special days it\'s UGX 40,000. Outside of those days, the price is UGX 80,000. No exceptions.',
      },
    ],
  },
  {
    section: 'The Loyalty Card',
    items: [
      {
        q: 'What is the loyalty card and how does it work?',
        a: 'Every order earns you points. When you hit 500 points you reach Reserve tier; 1,500 points and you\'re Crown — our highest. You can apply for a physical card through your account, and we\'ll post it to you once approved.',
      },
      {
        q: 'How do I apply for my loyalty card?',
        a: 'Log into your account, head to the Loyalty Card tab, and submit your delivery address. We review every application and respond by email. Approved applications are dispatched within a few days.',
      },
    ],
  },
]

function FAQItem({ q, a, index, sectionIndex }) {
  const [open, setOpen] = useState(false)
  const id = `faq-${sectionIndex}-${index}`

  return (
    <div style={{ borderBottom: '1px solid rgba(184,117,42,0.15)' }}>
      <button
        id={`${id}-btn`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between gap-8 py-6 text-left group"
      >
        <div className="flex items-start gap-5">
          <span
            className="font-serif font-bold text-sm mt-0.5 flex-shrink-0 tabular-nums"
            style={{ color: 'rgba(184,117,42,0.3)' }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <span
            className="font-serif font-bold leading-snug transition-colors duration-200"
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.2rem)',
              color: open ? '#F2EAD8' : 'rgba(242,234,216,0.75)',
            }}
          >
            {q}
          </span>
        </div>
        <span
          className="text-2xl flex-shrink-0 mt-0.5 transition-transform duration-300 font-light"
          style={{
            color:     '#B8752A',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          +
        </span>
      </button>

      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        className="overflow-hidden transition-all duration-400"
        style={{ maxHeight: open ? '300px' : '0' }}
      >
        <p
          className="text-sm leading-relaxed pb-7 pl-10"
          style={{ color: 'rgba(242,234,216,0.5)' }}
        >
          {a}
        </p>
      </div>
    </div>
  )
}

export default function FAQPage() {
  return (
    <div style={{ background: '#0E0600', minHeight: '100vh' }}>
      <FAQSeo />

      {/* Page header */}
      <div className="border-b py-20 md:py-28 px-6 md:px-16" style={{ borderColor: 'rgba(184,117,42,0.2)' }}>
        <Crown size={22} color="#B8752A" className="mb-5 opacity-65" />
        <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-3" style={{ color: '#B8752A' }}>
          Questions
        </p>
        <h1
          className="font-serif font-bold leading-tight mb-4"
          style={{ fontSize: 'clamp(3.2rem, 8vw, 7rem)', color: '#F2EAD8' }}
        >
          FAQ.
        </h1>
        <div className="w-10 h-px" style={{ background: '#B8752A' }} />
        <p className="mt-5 text-base leading-relaxed max-w-md" style={{ color: 'rgba(242,234,216,0.35)' }}>
          The things people ask most. Answered plainly.
        </p>
      </div>

      {/* Sections */}
      <div className="px-6 md:px-16 py-12 max-w-3xl">
        {FAQ_SECTIONS.map((section, si) => (
          <div key={section.section} className={si > 0 ? 'mt-14' : ''}>

            {/* Section label */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px flex-shrink-0 w-4" style={{ background: '#B8752A' }} />
              <p
                className="text-[10px] font-bold uppercase tracking-[0.3em] whitespace-nowrap"
                style={{ color: '#B8752A' }}
              >
                {section.section}
              </p>
              <div className="h-px flex-1" style={{ background: 'rgba(184,117,42,0.2)' }} />
            </div>

            {section.items.map((item, i) => (
              <FAQItem
                key={i}
                q={item.q}
                a={item.a}
                index={i}
                sectionIndex={si}
              />
            ))}
          </div>
        ))}

        {/* Still have a question */}
        <div className="mt-16 pt-10" style={{ borderTop: '1px solid rgba(184,117,42,0.2)' }}>
          <p className="font-serif font-bold text-xl mb-2" style={{ color: '#F2EAD8' }}>
            Still have a question?
          </p>
          <p className="text-sm mb-5" style={{ color: 'rgba(242,234,216,0.35)' }}>
            We're real people. We respond.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 font-bold text-[11px] tracking-[0.25em] uppercase transition-opacity hover:opacity-70"
            style={{ color: '#B8752A' }}
          >
            Contact Us <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
