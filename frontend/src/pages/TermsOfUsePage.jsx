import SEO from '../components/shared/SEO'
import { Link } from 'react-router-dom'

const EFFECTIVE_DATE = '18 June 2025'
const LAST_UPDATED   = '18 June 2025'

function Section({ title, children }) {
  return (
    <section className="mb-10">
      <h2 className="font-serif font-bold text-xl mb-4" style={{ color: '#E8C88A' }}>{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed" style={{ color: 'rgba(242,234,216,0.75)' }}>
        {children}
      </div>
    </section>
  )
}

function List({ items }) {
  return (
    <ul className="space-y-1.5 pl-4" style={{ listStyleType: 'disc', color: 'rgba(242,234,216,0.7)' }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

export default function TermsOfUsePage() {
  return (
    <>
      <SEO
        title="Terms of Use | HAIQ"
        description="The terms and conditions governing your use of the HAIQ Bakery platform, ordering, delivery, and your rights as a customer."
      />
      <div style={{ background: '#1A0A00', minHeight: '100vh' }} className="px-6 py-16">
        <div className="max-w-3xl mx-auto">

          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: '#B8752A' }}>Legal</p>
          <h1 className="font-serif font-bold text-4xl mb-2" style={{ color: '#F2EAD8' }}>Terms of Use</h1>
          <div className="w-8 h-px mb-6" style={{ background: '#B8752A' }} />
          <p className="text-xs mb-10" style={{ color: '#8C7355' }}>
            Effective Date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last Updated: {LAST_UPDATED}
          </p>

          <p className="text-sm leading-relaxed mb-10" style={{ color: 'rgba(242,234,216,0.7)' }}>
            These Terms of Use ("Terms") govern your access to and use of the HAIQ Bakery website (haiq.ug) and any services offered through it. By accessing the website, creating an account, or placing an order, you agree to be bound by these Terms. Please read them carefully before using our platform. If you do not agree with any part of these Terms, please do not use our website.
          </p>

          <div style={{ borderTop: '1px solid rgba(184,117,42,0.15)' }} className="pt-10">

            <Section title="1. About HAIQ Bakery">
              <p>
                HAIQ Bakery is a premium handcrafted cookie brand operated from Muyenga, Kampala, Uganda. We sell cookies, drinks, and cookie boxes online for delivery within Kampala and selected surrounding areas.
              </p>
              <div className="p-4 mt-2" style={{ background: 'rgba(184,117,42,0.08)', border: '1px solid rgba(184,117,42,0.2)' }}>
                <p><strong style={{ color: '#F2EAD8' }}>HAIQ Bakery</strong></p>
                <p>Muyenga, Kampala, Uganda</p>
                <p>Email: <a href="mailto:haiqafrica@gmail.com" style={{ color: '#B8752A' }}>haiqafrica@gmail.com</a></p>
              </div>
            </Section>

            <Section title="2. Acceptance of Terms">
              <p>By using this website or placing an order, you confirm that:</p>
              <List items={[
                'You are at least 18 years of age, or if younger, you have the explicit consent of a parent or legal guardian who has read and agrees to these Terms on your behalf',
                'You have read, understood, and agree to be bound by these Terms of Use',
                'You have read and agree to our Privacy Policy, which is incorporated into these Terms by reference',
                'You have the legal capacity to enter into a binding contract under the laws of Uganda',
                'All information you provide to us is accurate, current, and complete',
              ]} />
            </Section>

            <Section title="3. Products and Services">
              <p>HAIQ Bakery offers the following products through our website:</p>
              <List items={[
                'Individual handcrafted cookies in various flavours and sizes',
                'Bottled drinks',
                'Build Your Box — a curated selection of cookies assembled into a custom box',
              ]} />
              <p>All cookies are handcrafted in small batches. Due to the handmade nature of our products, minor variations in appearance, size, and colour are expected and are not defects.</p>
              <p>Product availability is subject to change. We may discontinue, limit, or modify products at any time without prior notice. Where a product is unavailable after an order is placed, we will contact you promptly to arrange an alternative or a refund.</p>
            </Section>

            <Section title="4. Pricing and Currency">
              <List items={[
                'All prices on our website are quoted in Uganda Shillings (UGX) and include applicable taxes',
                'Delivery fees are calculated based on your delivery zone and are shown at checkout before you confirm your order',
                'The "Build Your Box" price may vary depending on whether your purchase date is designated as a special day. The applicable price is always confirmed at checkout and in your order confirmation email',
                'Prices are subject to change without prior notice. The price applicable to your order is the price confirmed at the time you place your order',
                'In the event of a clear pricing error, we reserve the right to cancel an order and offer a refund rather than fulfil it at the incorrect price',
              ]} />
            </Section>

            <Section title="5. Ordering and Contract Formation">
              <p>When you place an order on haiq.ug:</p>
              <List items={[
                'Your submission of an order constitutes an offer to purchase the specified products at the stated price',
                'A binding contract between you and HAIQ Bakery is formed when we send you an order confirmation email',
                'We reserve the right to accept or decline any order at our discretion, including for reasons of stock availability, pricing errors, suspected fraud, or our inability to fulfil delivery to your address',
                'If we decline an order after a payment has been made, we will issue a full refund within 5 business days',
                'Your order details, including items, prices, and delivery information, are captured in your account and in your confirmation email. Please review them carefully — you are responsible for the accuracy of the order you submit',
              ]} />
            </Section>

            <Section title="6. Delivery">
              <p>We currently deliver within Kampala and selected surrounding areas. Delivery availability and zones are shown at checkout.</p>
              <List items={[
                'Estimated delivery times are provided for guidance only and are not a guarantee. Delays may occur due to weather, traffic, high order volumes, or other circumstances outside our control',
                'You are solely responsible for providing a complete, accurate, and accessible delivery address. HAIQ Bakery is not liable for failed deliveries resulting from an incorrect or inaccessible address',
                'Risk in the products passes to you upon delivery to the address you provided',
                'If no one is available to receive your delivery and the driver cannot safely leave the order, we will contact you. If we are unable to reach you, we may have to cancel the delivery. In such cases, a re-delivery fee may apply',
                'Delivery fees are non-refundable unless the failure to deliver is due to our error',
              ]} />
            </Section>

            <Section title="7. Payment">
              <p>HAIQ Bakery currently accepts <strong style={{ color: '#F2EAD8' }}>Cash on Delivery (COD) only</strong>. Payment is due in full at the time your order is delivered to you.</p>
              <List items={[
                'You must have the exact cash amount or be prepared to receive change from our delivery driver',
                'Refusal to pay upon delivery without legitimate cause may result in suspension or permanent ban from our platform',
                'We do not currently accept card payments, mobile money, or bank transfers',
                'We do not process, collect, or store any payment card numbers, mobile money credentials, or banking information',
              ]} />
              <p>We reserve the right to introduce additional payment methods in future. Any such changes will be reflected in these Terms and communicated on our platform.</p>
            </Section>

            <Section title="8. Cancellations">
              <p><strong style={{ color: '#F2EAD8' }}>By the Customer:</strong></p>
              <List items={[
                'You may cancel your order at any time before its status changes to "En Route." Once an order has been dispatched for delivery, cancellation is no longer available through the platform',
                'To cancel a pending order, log in to your account, navigate to "Your Orders," select the order, and click "Cancel This Order." You will be asked to provide a reason',
                'Where a future payment method is introduced, any prepayment will be refunded to you within 5 business days of a successful cancellation',
              ]} />
              <p className="mt-3"><strong style={{ color: '#F2EAD8' }}>By HAIQ Bakery:</strong></p>
              <List items={[
                'We may cancel your order if we are unable to fulfil it due to stock shortage, kitchen capacity, an incorrect delivery address, our inability to contact you, or suspected fraudulent activity',
                'We will notify you as soon as possible if we cancel your order',
              ]} />
            </Section>

            <Section title="9. Refunds and Complaints About Quality">
              <p>We take the quality of our products seriously. If you have a complaint about the quality or condition of an item you received:</p>
              <List items={[
                'Contact us within 24 hours of delivery at haiqafrica@gmail.com or through our Contact page, describing the issue and providing photographic evidence where possible',
                'We will assess the complaint and may offer a replacement, a partial refund, or a full refund at our sole discretion depending on the nature of the issue',
                'Food products are generally non-returnable for hygiene reasons. This does not affect your statutory rights where products are genuinely defective or not as described',
                'Change-of-mind returns are not accepted',
              ]} />
            </Section>

            <Section title="10. User Accounts">
              <p>An account is not required to browse our website. However, an account is required to place orders and access features such as order tracking.</p>
              <List items={[
                'You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account',
                'You must provide accurate, current, and complete registration information and update it as necessary',
                'You may not share your account credentials with any other person',
                'You must notify us immediately at haiqafrica@gmail.com if you become aware of any unauthorised use of your account',
                'We may suspend or permanently terminate your account if we reasonably believe that you have breached these Terms, engaged in fraudulent or abusive behaviour, or if required to do so by law',
              ]} />
            </Section>

            <Section title="11. Allergens and Food Safety">
              <p>Our cookies are baked in a kitchen that handles the following allergens:</p>
              <List items={[
                'Wheat and gluten',
                'Dairy and dairy products',
                'Eggs',
                'Nuts (including tree nuts)',
              ]} />
              <p>Cross-contamination between products may occur. Specific ingredient information is available on individual product pages. You are solely responsible for ensuring that the products you order are suitable for your dietary needs and health requirements. HAIQ Bakery does not accept liability for allergic reactions or adverse health effects arising from consumption of our products where you have not reviewed the allergen information.</p>
            </Section>

            <Section title="12. Prohibited Conduct">
              <p>You agree not to:</p>
              <List items={[
                'Use our platform for any purpose that is unlawful under Ugandan law or the laws of your jurisdiction',
                'Provide false, inaccurate, or misleading information at any point during registration, ordering, or when contacting us',
                'Impersonate any person or entity, or falsely represent your affiliation with any person or entity',
                'Attempt to gain unauthorised access to any part of our platform, our servers, or the accounts of other users',
                'Engage in any form of automated data collection, web scraping, or mass downloading of content without our written consent',
                'Submit content — including reviews or messages — that is defamatory, obscene, threatening, harassing, or that infringes the intellectual property rights of any third party',
                'Use our platform to transmit spam, unsolicited commercial communications, or any form of malware',
                'Interfere with or disrupt the normal operation of the platform or its infrastructure',
                'Place orders with no genuine intent to pay (fraudulent ordering)',
              ]} />
              <p>Violation of these prohibitions may result in account suspension or termination, and we reserve the right to involve law enforcement authorities where appropriate.</p>
            </Section>

            <Section title="13. Product Reviews">
              <List items={[
                'By submitting a review, you grant HAIQ Bakery a perpetual, non-exclusive, royalty-free licence to display, reproduce, and use your review content on our website and in marketing materials',
                'Reviews must be honest, based on genuine experience, and relevant to the product reviewed',
                'We reserve the right to remove, edit, or decline to publish reviews that we reasonably consider to violate these standards, to be defamatory, to contain personal information, or to be otherwise inappropriate',
                'Published reviews reflect the opinions of individual customers and are not endorsed by HAIQ Bakery',
              ]} />
            </Section>

            <Section title="14. Intellectual Property">
              <p>All content on haiq.ug — including but not limited to our brand name, logo, product names, product descriptions, photography, written content, design, and source code — is the exclusive property of HAIQ Bakery and is protected by Ugandan and international intellectual property laws.</p>
              <p>You may not reproduce, copy, distribute, modify, or create derivative works from any of our content without our prior written permission. Personal, non-commercial sharing of links to our website is permitted.</p>
            </Section>

            <Section title="15. Third-Party Links">
              <p>Our website may contain links to third-party websites (such as our social media pages). These links are provided for your convenience only. HAIQ Bakery has no control over the content or practices of third-party sites and accepts no responsibility or liability for them. Visiting any linked site is at your own risk.</p>
            </Section>

            <Section title="16. Disclaimer of Warranties">
              <p>To the maximum extent permitted by applicable Ugandan law, HAIQ Bakery provides the platform and all products "as is" and "as available" without any warranty, express or implied, including warranties of merchantability, fitness for a particular purpose, title, or non-infringement.</p>
              <p>We do not warrant that the website will be uninterrupted, error-free, or free from viruses or other harmful components. We do not warrant that delivery times will always be met.</p>
            </Section>

            <Section title="17. Limitation of Liability">
              <p>To the maximum extent permitted by Ugandan law, HAIQ Bakery's total liability to you for any claim arising out of or in connection with these Terms or your use of the platform shall not exceed the amount actually paid by you for the specific order giving rise to the claim.</p>
              <p>HAIQ Bakery shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, loss of data, loss of goodwill, or business interruption, even if we have been advised of the possibility of such damages.</p>
              <p>Nothing in these Terms excludes or limits liability for death or personal injury caused by our negligence, for fraud or fraudulent misrepresentation, or for any other liability that cannot be excluded or limited under Ugandan law.</p>
            </Section>

            <Section title="18. Governing Law and Dispute Resolution">
              <p>These Terms are governed by and construed in accordance with the laws of the Republic of Uganda.</p>
              <p>If a dispute arises between you and HAIQ Bakery, we ask that you first contact us at <a href="mailto:haiqafrica@gmail.com" style={{ color: '#B8752A' }}>haiqafrica@gmail.com</a> and give us a reasonable opportunity to resolve the matter. We aim to respond to all complaints within 5 business days.</p>
              <p>If a dispute cannot be resolved informally within 30 days, both parties agree to submit to binding arbitration in Kampala under the rules of the Centre for Arbitration and Dispute Resolution (CADER). This does not affect your right to seek urgent injunctive relief from a Ugandan court of competent jurisdiction.</p>
            </Section>

            <Section title="19. Severability">
              <p>If any provision of these Terms is found to be invalid, unlawful, or unenforceable by a court of competent jurisdiction, that provision shall be deemed severed from the remainder of the Terms, which shall continue in full force and effect.</p>
            </Section>

            <Section title="20. Entire Agreement">
              <p>These Terms of Use and our <Link to="/privacy" style={{ color: '#B8752A' }}>Privacy Policy</Link> constitute the entire agreement between you and HAIQ Bakery regarding your use of our platform and supersede all prior agreements, representations, or understandings relating to the same subject matter.</p>
            </Section>

            <Section title="21. Changes to These Terms">
              <p>We may update these Terms from time to time to reflect changes in our services, practices, or legal requirements. When we make material changes, we will update the "Last Updated" date at the top of this page and, where appropriate, notify you by email or through a notice on the website.</p>
              <p>Your continued use of our platform after any changes constitutes your acceptance of the updated Terms. We encourage you to review these Terms periodically.</p>
            </Section>

            <Section title="22. Contact">
              <div className="p-4" style={{ background: 'rgba(184,117,42,0.08)', border: '1px solid rgba(184,117,42,0.2)' }}>
                <p><strong style={{ color: '#F2EAD8' }}>HAIQ Bakery</strong></p>
                <p>Muyenga, Kampala, Uganda</p>
                <p>Email: <a href="mailto:haiqafrica@gmail.com" style={{ color: '#B8752A' }}>haiqafrica@gmail.com</a></p>
                <p>Website: <a href="https://haiq.ug" style={{ color: '#B8752A' }}>haiq.ug</a></p>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </>
  )
}
