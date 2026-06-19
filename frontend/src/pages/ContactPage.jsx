import { useState } from 'react'
import DOMPurify from 'dompurify'
import api from '../services/api'
import Button from '../components/shared/Button'
import { ContactSEO } from '../components/shared/SEO'
import { CheckCircle, ArrowRight } from 'lucide-react'

// SVG Icons
const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.72 6.72l1.06-1.06a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
  </svg>
)

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
)

const MapPinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
)

const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
    <circle cx="17.5" cy="6.5" r="1.5"/>
  </svg>
)

const TikTokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 12a4 4 0 104 4V4a5 5 0 005 5"/>
  </svg>
)

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 3a10.9 10.9 0 01-3.14 1.53A4.48 4.48 0 0012 8v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/>
  </svg>
)

const CONTACT_ITEMS = [
  {
    icon: PhoneIcon,
    label: 'Phone',
    lines: ['+256 753 996 786', '+256 791 058 916'],
    link: 'tel:+256753996786',
    linkLabel: 'Call us',
  },
  {
    icon: MailIcon,
    label: 'Email',
    lines: ['haiqafrica@gmail.com'],
    link: 'mailto:haiqafrica@gmail.com',
    linkLabel: 'Send email',
  },
  {
    icon: MapPinIcon,
    label: 'Location',
    lines: ['Muyenga', 'Kampala, Uganda'],
    link: 'https://maps.google.com/?q=Muyenga+Kampala+Uganda',
    linkLabel: 'Open in Maps',
  },
]

const SOCIAL_ITEMS = [
  {
    platform: 'Instagram',
    handle: '@haiq_ug',
    url: 'https://instagram.com/haiq_ug',
    icon: InstagramIcon,
  },
  {
    platform: 'TikTok',
    handle: '@haiq_africa',
    url: 'https://www.tiktok.com/@haiq_africa',
    icon: TikTokIcon,
  },
  {
    platform: 'Twitter / X',
    handle: 'Haiqafrica',
    url: 'https://twitter.com/Haiqafrica',
    icon: TwitterIcon,
  },
]

export default function ContactPage() {
  const [form,   setForm]   = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState(null) // null | loading | success | error

  const containsInvalidContent = (value = '') => {
    if (!value) return false
    const patterns = [
      /<[^>]*>/,           // HTML tags
      /javascript:/i,      // javascript: protocol
      /data:/i,            // data: protocol
      /<script/i,          // script tags
      /eval\s*\(/i,        // eval
      /on\w+\s*=/i,        // event handlers
      /<iframe/i,          // iframe
      /<object/i,          // object tags
      /<embed/i,           // embed tags
    ]
    return patterns.some(p => p.test(value))
  }

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if ([form.name, form.email, form.subject, form.message].some(containsInvalidContent)) {
      setStatus('error')
      return
    }
    setStatus('loading')
    try {
      await api.post('/messages', {
        name:    form.name.trim(),
        email:   form.email.trim(),
        subject: form.subject.trim(),
        body:    form.message.trim(),
      })
      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      console.error('Message send error:', err.response?.data || err.message)
      setStatus('error')
    }
  }

  return (
    <div className="bg-light min-h-screen">
      <ContactSEO />

      {/* Hero bar */}
      <div className="bg-dark text-light py-16">
        <div className="container mx-auto px-6 text-center">
          <p className="text-primary text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            We would love to hear from you
          </p>
          <h1 className="font-serif text-5xl md:text-6xl font-bold">Contact Us</h1>
        </div>
      </div>

      <div className="container mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-16">

          {/* ── Left: Contact info ── */}
          <div>
            <h2 className="font-serif text-3xl font-bold text-dark mb-8">Get in Touch</h2>

            {/* Contact items */}
            <div className="space-y-6 mb-12">
              {CONTACT_ITEMS.map(item => {
                const IconComponent = item.icon
                return (
                <div key={item.label} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0"
                    style={{ color: '#B8752A' }}>
                    <IconComponent />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-1">
                      {item.label}
                    </p>
                    {item.lines.map(l => (
                      <p key={l} className="text-dark font-medium">{l}</p>
                    ))}
                    <a
                      href={item.link}
                      target={item.link.startsWith('http') ? '_blank' : undefined}
                      rel="noreferrer"
                      className="text-sm text-gray-400 hover:text-primary transition mt-0.5 inline-flex items-center gap-1"
                    >
                      {item.linkLabel} <ArrowRight size={13} />
                    </a>
                  </div>
                </div>
                )
              })}
            </div>

            {/* Social */}
            <div>
              <p className="text-xs font-semibold text-primary tracking-widest uppercase mb-4">
                Follow Us
              </p>
              <div className="grid grid-cols-2 gap-3">
                {SOCIAL_ITEMS.map(s => {
                  const IconComponent = s.icon
                  return (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-primary hover:bg-primary/5 transition-all group"
                  >
                    <span style={{ color: '#B8752A' }}><IconComponent /></span>
                    <div>
                      <p className="text-xs font-bold text-dark group-hover:text-primary transition">
                        {s.platform}
                      </p>
                      <p className="text-[11px] text-gray-400">{s.handle}</p>
                    </div>
                  </a>
                  )
                })}
              </div>
            </div>

            {/* Hours */}
            <div className="mt-10 p-5 bg-dark rounded-2xl text-light">
              <p className="text-primary text-xs font-bold tracking-widest uppercase mb-3">
                Order Hours
              </p>
              <p>Working Hours: 24/7</p>
              <p className="text-light/40 text-xs mt-3">
                Order before noon for same-day delivery in Kampala.
              </p>
            </div>
          </div>

          {/* ── Right: Message form ── */}
          <div>
            <h2 className="font-serif text-3xl font-bold text-dark mb-8">Send a Message</h2>

            {status === 'success' ? (
              <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center">
                <CheckCircle size={40} style={{ color: '#B8752A' }} className="mb-3 mx-auto" />
                <h3 className="font-serif text-xl font-bold text-dark mb-2">Message received!</h3>
                <p className="text-gray-500 text-sm">
                  We will get back to you within a few hours on WhatsApp or email.
                </p>
                <Button onClick={() => setStatus(null)} variant="secondary" size="sm">
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-dark mb-1">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Amara Nakato"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition"
                    style={{ color: '#1A0A00' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-1">
                    Email Address <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition"
                    style={{ color: '#1A0A00' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-1">
                    Subject <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    placeholder="What's this about?"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition"
                    style={{ color: '#1A0A00' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-dark mb-1">
                    Message <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Tell us what you're looking for — orders, events, feedback, anything."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary transition"
                    style={{ color: '#1A0A00' }}
                  />
                </div>

                {status === 'error' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <p className="font-medium">Unable to send message</p>
                    <p className="text-xs mt-1">Please check your input and try again. If the issue persists, call or email us directly.</p>
                  </div>
                )}

                <Button type="submit" disabled={status === 'loading'} loading={status === 'loading'} variant="primary" className="w-full" size="md">
                  Send Message
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
