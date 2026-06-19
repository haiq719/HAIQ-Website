/**
 * SEO.jsx — HAIQ Bakery SEO component
 * Usage: <SEO title="..." description="..." image="..." type="product" product={...} />
 *
 * Install react-helmet-async:
 *   cd frontend && npm install react-helmet-async
 *
 * In main.jsx, wrap App with <HelmetProvider>:
 *   import { HelmetProvider } from 'react-helmet-async'
 *   <HelmetProvider><App /></HelmetProvider>
 */
import { Helmet } from 'react-helmet-async'

const SITE_URL  = 'https://haiq.ug'
const SITE_NAME = 'HAIQ Bakery'
const SITE_DESC = 'Premium handcrafted cookies baked fresh every morning in Kampala, Uganda. Made For You.'
const DEFAULT_IMAGE = `${SITE_URL}/HAIQmain.png`

// JSON-LD for the bakery organization
const ORG_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Bakery',
  name: 'HAIQ Bakery',
  description: SITE_DESC,
  url: SITE_URL,
  logo: DEFAULT_IMAGE,
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Muyenga',
    addressLocality: 'Kampala',
    addressCountry: 'UG',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+256753996786',
    contactType: 'customer service',
  },
  sameAs: [
    'https://instagram.com/haiq_ug',
    'https://www.tiktok.com/@haiq_africa',
  ],
  servesCuisine: 'Bakery',
  priceRange: 'UGX 5,000 – UGX 80,000',
  currenciesAccepted: 'UGX',
  openingHours: 'Mo-Su 07:00-20:00',
}

export default function SEO({
  title,
  description = SITE_DESC,
  image       = DEFAULT_IMAGE,
  url,
  type        = 'website',
  product,       // product object for product schema
  noindex     = false,
  breadcrumbs,   // [{ name, url }]
}) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Made For You`
  const pageUrl   = url ? `${SITE_URL}${url}` : SITE_URL
  const pageImage = image.startsWith('http') ? image : `${SITE_URL}${image}`

  const schemas = [ORG_SCHEMA]

  // Product schema
  if (product) {
    schemas.push({
      '@context':   'https://schema.org',
      '@type':      'Product',
      name:         product.name,
      description:  product.description,
      image:        pageImage,
      brand:        { '@type': 'Brand', name: 'HAIQ Bakery' },
      offers: {
        '@type':        'Offer',
        price:          product.base_price || 5000,
        priceCurrency:  'UGX',
        availability:   product.is_active !== false
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url:            pageUrl,
        seller:         { '@type': 'Organization', name: 'HAIQ Bakery' },
      },
    })
  }

  // Breadcrumb schema
  if (breadcrumbs?.length) {
    schemas.push({
      '@context':       'https://schema.org',
      '@type':          'BreadcrumbList',
      itemListElement:  breadcrumbs.map((bc, i) => ({
        '@type':   'ListItem',
        position:  i + 1,
        name:      bc.name,
        item:      bc.url.startsWith('http') ? bc.url : `${SITE_URL}${bc.url}`,
      })),
    })
  }

  return (
    <Helmet>
      {/* ── Basic ── */}
      <html lang="en" />
      <title>{pageTitle}</title>
      <meta name="description"       content={description} />
      <meta name="robots"            content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large'} />
      <link rel="canonical"          href={pageUrl} />

      {/* ── Open Graph ── */}
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image"       content={pageImage} />
      <meta property="og:image:alt"   content={title || SITE_NAME} />
      <meta property="og:url"         content={pageUrl} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"      content="en_UG" />

      {/* ── Twitter / X ── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image"       content={pageImage} />
      <meta name="twitter:site"        content="@haiq_ug" />

      {/* ── JSON-LD ── */}
      {schemas.map((s, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(s)}
        </script>
      ))}

      {/* ── Theme color ── */}
      <meta name="theme-color" content="#1A0A00" />
    </Helmet>
  )
}

// ── Named exports for common pages ────────────────────────────────────────────
export function HomeSEO() {
  return (
    <SEO
      title="Made For You — Premium Cookies Baked Fresh in Kampala"
      description="HAIQ Bakery — handcrafted cookies baked fresh every morning in Muyenga, Kampala. Venom, Blackout, Crimson Sin, Campfire After Dark, Coconut. Order now."
      url="/"
      breadcrumbs={[{ name: 'HAIQ Bakery', url: '/' }]}
    />
  )
}

export function ShopSEO() {
  return (
    <SEO
      title="Shop All Cookies"
      description="Browse HAIQ's full collection. Six premium handcrafted cookie flavours — all baked fresh in Kampala. From UGX 5,000. Order today."
      url="/shop"
      breadcrumbs={[{ name: 'HAIQ Bakery', url: '/' }, { name: 'Shop', url: '/shop' }]}
    />
  )
}

export function ProductSEO({ product }) {
  if (!product) return null
  return (
    <SEO
      title={`${product.name} — ${product.subtitle || 'Cookies'}`}
      description={product.description || SITE_DESC}
      image={product.images?.[0]?.url || DEFAULT_IMAGE}
      url={`/products/${product.slug}`}
      type="product"
      product={product}
      breadcrumbs={[
        { name: 'HAIQ Bakery', url: '/' },
        { name: 'Shop',        url: '/shop' },
        { name: product.name,  url: `/products/${product.slug}` },
      ]}
    />
  )
}

export function FAQSeo() {
  return (
    <SEO
      title="FAQ — Cookie Questions Answered"
      description="Answers to the most common HAIQ Bakery questions. Delivery, pricing, ingredients, and more."
      url="/faq"
      breadcrumbs={[{ name: 'HAIQ Bakery', url: '/' }, { name: 'FAQ', url: '/faq' }]}
    />
  )
}

export function ContactSEO() {
  return (
    <SEO
      title="Contact Us — HAIQ Bakery Kampala"
      description="Get in touch with HAIQ Bakery. We're based in Muyenga, Kampala. Send us a message and we'll get back to you."
      url="/contact"
      breadcrumbs={[{ name: 'HAIQ Bakery', url: '/' }, { name: 'Contact', url: '/contact' }]}
    />
  )
}

export function MomentsSEO() {
  return (
    <SEO
      title="Moments — HAIQ Bakery"
      description="Real moments from real HAIQ customers. See how our handcrafted cookies are enjoyed across Kampala."
      url="/moments"
      breadcrumbs={[{ name: 'HAIQ Bakery', url: '/' }, { name: 'Moments', url: '/moments' }]}
    />
  )
}

export function BuildYourBoxSEO() {
  return (
    <SEO
      title="Build Your Box — Custom Cookie Box from UGX 40,000"
      description="Pick exactly 4 cookie flavours and build your own HAIQ cookie box. Fresh-baked and delivered in Kampala. From UGX 40,000."
      url="/build-your-box"
      breadcrumbs={[{ name: 'HAIQ Bakery', url: '/' }, { name: 'Build Your Box', url: '/build-your-box' }]}
    />
  )
}

export function LoginSEO() {
  return <SEO title="Login — HAIQ Bakery" description="Sign in to your HAIQ Bakery account." url="/login" noindex={true} />
}

export function RegisterSEO() {
  return <SEO title="Create Account — HAIQ Bakery" description="Create a HAIQ Bakery account to track orders and save your details." url="/register" noindex={true} />
}

export function PrivacySEO() {
  return (
    <SEO
      title="Privacy Policy — HAIQ Bakery"
      description="How HAIQ Bakery collects, uses, and protects your personal data."
      url="/privacy"
      noindex={true}
    />
  )
}

export function TermsSEO() {
  return (
    <SEO
      title="Terms of Use — HAIQ Bakery"
      description="Terms and conditions for using the HAIQ Bakery website and placing orders."
      url="/terms"
      noindex={true}
    />
  )
}
