import SEO from '../components/shared/SEO'

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

function Sub({ title, children }) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-sm mb-1.5" style={{ color: '#F2EAD8' }}>{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed" style={{ color: 'rgba(242,234,216,0.7)' }}>
        {children}
      </div>
    </div>
  )
}

function List({ items }) {
  return (
    <ul className="space-y-1.5 pl-4" style={{ listStyleType: 'disc', color: 'rgba(242,234,216,0.7)' }}>
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  )
}

export default function PrivacyPolicyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy | HAIQ"
        description="How HAIQ Bakery collects, uses, and protects your personal information. Compliant with the Uganda Data Protection and Privacy Act 2019."
      />
      <div style={{ background: '#1A0A00', minHeight: '100vh' }} className="px-6 py-16">
        <div className="max-w-3xl mx-auto">

          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: '#B8752A' }}>Legal</p>
          <h1 className="font-serif font-bold text-4xl mb-2" style={{ color: '#F2EAD8' }}>Privacy Policy</h1>
          <div className="w-8 h-px mb-6" style={{ background: '#B8752A' }} />
          <p className="text-xs mb-10" style={{ color: '#8C7355' }}>
            Effective Date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last Updated: {LAST_UPDATED}
          </p>

          {/* Intro */}
          <p className="text-sm leading-relaxed mb-10" style={{ color: 'rgba(242,234,216,0.7)' }}>
            HAIQ Bakery ("HAIQ", "we", "us", or "our") is committed to protecting your personal information and your right to privacy. This Privacy Policy explains what information we collect, why we collect it, how we use and store it, who we share it with, how long we keep it, and what rights you have over it. It applies to all personal data processed through our website (haiq.ug) and any related services. We operate under the <strong style={{ color: '#F2EAD8' }}>Uganda Data Protection and Privacy Act 2019 (PDPA)</strong> and its associated Regulations.
          </p>

          <div style={{ borderTop: '1px solid rgba(184,117,42,0.15)' }} className="pt-10">

            <Section title="1. Who We Are">
              <p>
                <strong style={{ color: '#F2EAD8' }}>Data Controller:</strong> HAIQ Bakery<br />
                <strong style={{ color: '#F2EAD8' }}>Address:</strong> Muyenga, Kampala, Uganda<br />
                <strong style={{ color: '#F2EAD8' }}>Email:</strong> privacy@haiq.ug<br />
                <strong style={{ color: '#F2EAD8' }}>Website:</strong> haiq.ug
              </p>
              <p>
                As the data controller, HAIQ Bakery determines the purposes for which and the means by which your personal data is processed. If you have any questions or concerns about this policy or your data, contact us at the address above.
              </p>
            </Section>

            <Section title="2. What Personal Data We Collect">
              <Sub title="2.1 Account and Identity Data">
                <p>When you create an account, we collect:</p>
                <List items={[
                  'Full name (first and last)',
                  'Email address',
                  'Phone number',
                  'Password (stored as a one-way cryptographic hash — we never store your password in plain text)',
                ]} />
              </Sub>

              <Sub title="2.2 Order and Delivery Data">
                <p>When you place an order, we collect:</p>
                <List items={[
                  'Delivery address (entered at checkout)',
                  'Delivery zone and associated delivery fee',
                  'Items ordered (product names, sizes, quantities)',
                  'Order total and status',
                  'Order timestamp and unique order reference number',
                  'Cancellation reason (if applicable)',
                ]} />
              </Sub>

              <Sub title="2.3 Contact and Communication Data">
                <p>If you contact us through our contact form, we collect:</p>
                <List items={[
                  'Your name',
                  'Your email address',
                  'The content of your message',
                ]} />
              </Sub>

              <Sub title="2.4 Newsletter and Marketing Data">
                <p>If you subscribe to our newsletter, we collect:</p>
                <List items={[
                  'Your email address',
                  'Subscription status (subscribed / unsubscribed)',
                  'The date you subscribed',
                ]} />
                <p>You may unsubscribe at any time via the unsubscribe link in any email we send you, or by contacting us directly.</p>
              </Sub>

              <Sub title="2.5 Review Data">
                <p>If you submit a product review, we collect:</p>
                <List items={[
                  'Your display name (taken from your account)',
                  'Your star rating and written comment',
                  'Whether your review is from a verified purchase',
                ]} />
              </Sub>

              <Sub title="2.6 Technical Data">
                <p>We may automatically collect limited technical data to keep the service running:</p>
                <List items={[
                  'Server-side request logs (IP address, request path, HTTP status code) — used for error diagnostics and security monitoring only',
                  'No browser cookies are set by our application beyond what is strictly necessary for session authentication (a JSON Web Token stored in the browser\'s local storage)',
                ]} />
              </Sub>

              <Sub title="2.7 Data We Do NOT Collect">
                <List items={[
                  'Payment card numbers, bank account details, or mobile money PINs — we are a Cash on Delivery business; no payment data is processed or stored by us',
                  'Government-issued ID numbers',
                  'Biometric data',
                  'Location data beyond the delivery address you provide',
                  'Data about minors under the age of 13',
                ]} />
              </Sub>
            </Section>

            <Section title="3. How We Collect Your Data">
              <List items={[
                'Directly from you — when you register an account, place an order, fill out our contact form, subscribe to our newsletter, or leave a review',
                'Automatically — limited server logs generated when you interact with our website',
              ]} />
              <p>We do not purchase personal data from third parties or obtain your data through social media scraping.</p>
            </Section>

            <Section title="4. Why We Process Your Data and Our Legal Basis">
              <p>Under the PDPA 2019, we must have a lawful basis for processing your personal data. We rely on the following:</p>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs border-collapse" style={{ borderColor: 'rgba(184,117,42,0.2)' }}>
                  <thead>
                    <tr style={{ background: 'rgba(184,117,42,0.12)' }}>
                      <th className="text-left p-3 font-semibold" style={{ color: '#E8C88A', border: '1px solid rgba(184,117,42,0.2)' }}>Purpose</th>
                      <th className="text-left p-3 font-semibold" style={{ color: '#E8C88A', border: '1px solid rgba(184,117,42,0.2)' }}>Data Used</th>
                      <th className="text-left p-3 font-semibold" style={{ color: '#E8C88A', border: '1px solid rgba(184,117,42,0.2)' }}>Lawful Basis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Process and fulfil your order', 'Name, phone, delivery address, order details', 'Contract performance'],
                      ['Manage your account', 'Name, email, hashed password', 'Contract performance'],
                      ['Send order status notifications', 'Email, name, order status', 'Contract performance'],
                      ['Respond to contact form enquiries', 'Name, email, message content', 'Legitimate interests'],
                      ['Send marketing emails (newsletter)', 'Email', 'Consent (opt-in)'],
                      ['Maintain security and prevent fraud', 'Server logs, account data', 'Legitimate interests'],
                      ['Comply with legal obligations (e.g. tax records)', 'Order records', 'Legal obligation'],
                      ['Analyse service performance and improve the platform', 'Aggregated, anonymised order data', 'Legitimate interests'],
                    ].map(([purpose, data, basis], i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(184,117,42,0.04)' }}>
                        <td className="p-3" style={{ color: 'rgba(242,234,216,0.7)', border: '1px solid rgba(184,117,42,0.15)' }}>{purpose}</td>
                        <td className="p-3" style={{ color: 'rgba(242,234,216,0.55)', border: '1px solid rgba(184,117,42,0.15)' }}>{data}</td>
                        <td className="p-3" style={{ color: '#B8752A', border: '1px solid rgba(184,117,42,0.15)' }}>{basis}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="5. Who We Share Your Data With">
              <p>We do not sell your personal data. We share it only with trusted third-party processors who act on our documented instructions, under contractual obligations to protect your data:</p>

              <Sub title="5.1 Resend (Email Delivery)">
                <p>We use Resend (resend.com) to send transactional emails (order confirmations, status updates) and newsletters. Resend receives your email address and the content of each email. Resend is bound by its own privacy policy and data processing terms.</p>
              </Sub>

              <Sub title="5.2 Neon (Database Hosting)">
                <p>Our database is hosted on Neon (neon.tech), a managed PostgreSQL cloud service. All personal data you provide is stored in this database. Neon operates on AWS infrastructure. Data is encrypted at rest and in transit.</p>
              </Sub>

              <Sub title="5.3 Render (API Hosting)">
                <p>Our backend API is hosted on Render (render.com). Render may handle request data as traffic passes through their infrastructure. No persistent storage of your personal data occurs on Render beyond in-flight request processing.</p>
              </Sub>

              <Sub title="5.4 Legal Disclosure">
                <p>We may disclose your personal data to government authorities or law enforcement where required by Ugandan law, a valid court order, or to protect the rights, property, or safety of HAIQ Bakery, our customers, or others.</p>
              </Sub>

              <p>We do not share your data with advertisers, data brokers, or any parties beyond those described above.</p>
            </Section>

            <Section title="6. Data Retention">
              <p>We retain your personal data only for as long as is necessary for the purposes described in this policy, or as required by law. The following table sets out our specific retention periods:</p>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr style={{ background: 'rgba(184,117,42,0.12)' }}>
                      <th className="text-left p-3 font-semibold" style={{ color: '#E8C88A', border: '1px solid rgba(184,117,42,0.2)' }}>Data Category</th>
                      <th className="text-left p-3 font-semibold" style={{ color: '#E8C88A', border: '1px solid rgba(184,117,42,0.2)' }}>Retention Period</th>
                      <th className="text-left p-3 font-semibold" style={{ color: '#E8C88A', border: '1px solid rgba(184,117,42,0.2)' }}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ['Account data (name, email, phone, password hash)', 'Until you request deletion, or 3 years of inactivity', 'Account management and service delivery'],
                      ['Order records', '7 years from order date', 'Tax compliance and legal obligation under Ugandan law'],
                      ['Delivery addresses', '7 years (attached to order records)', 'Part of order record'],
                      ['Contact form messages', '2 years', 'Customer service records'],
                      ['Newsletter subscriptions', 'Until you unsubscribe, then 30 days before purge', 'Email consent management'],
                      ['Product reviews', 'Indefinitely while your account is active; deleted on account deletion', 'Public product feedback record'],
                      ['Server logs', '30 days', 'Security monitoring and error diagnostics'],
                    ].map(([cat, period, reason], i) => (
                      <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(184,117,42,0.04)' }}>
                        <td className="p-3" style={{ color: 'rgba(242,234,216,0.7)', border: '1px solid rgba(184,117,42,0.15)' }}>{cat}</td>
                        <td className="p-3 font-medium" style={{ color: '#B8752A', border: '1px solid rgba(184,117,42,0.15)' }}>{period}</td>
                        <td className="p-3" style={{ color: 'rgba(242,234,216,0.55)', border: '1px solid rgba(184,117,42,0.15)' }}>{reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p>When data reaches the end of its retention period, we securely delete or anonymise it so it can no longer be linked to you.</p>
            </Section>

            <Section title="7. Security Measures">
              <p>We take the security of your personal data seriously and implement the following measures:</p>
              <List items={[
                'Passwords are stored as one-way bcrypt hashes — we cannot read your password and it cannot be reversed',
                'All data in transit between your browser and our servers is encrypted via HTTPS/TLS',
                'Our database is encrypted at rest on Neon\'s infrastructure',
                'Access to our admin dashboard is restricted to authorised personnel using separate, secured credentials',
                'Authentication tokens (JWTs) expire and are not stored server-side',
                'We do not log or transmit payment data of any kind — all orders are Cash on Delivery',
              ]} />
              <p>While we implement strong security practices, no system is completely immune to breaches. In the event of a data breach that is likely to result in a risk to your rights and freedoms, we will notify you and the relevant authority without undue delay, as required by the PDPA 2019.</p>
            </Section>

            <Section title="8. Cookies and Tracking">
              <p>Our website does not use advertising cookies, tracking pixels, or third-party analytics scripts. We do not track your browsing behaviour across other websites.</p>
              <p>Your authentication session is managed using a JSON Web Token stored in your browser's local storage. This token is used solely to identify your account during your session and contains no sensitive personal data beyond a user identifier.</p>
              <p>If you clear your browser's local storage, you will be signed out of your account.</p>
            </Section>

            <Section title="9. Your Rights Under the PDPA 2019">
              <p>Under the Uganda Data Protection and Privacy Act 2019, you have the following rights in relation to your personal data. You may exercise any of these rights by contacting us at <strong style={{ color: '#F2EAD8' }}>privacy@haiq.ug</strong>. We will respond within <strong style={{ color: '#F2EAD8' }}>21 days</strong> of receiving a verified request.</p>

              <Sub title="Right of Access">
                <p>You have the right to obtain confirmation of whether we hold personal data about you, and to receive a copy of that data along with information about how it is processed.</p>
              </Sub>

              <Sub title="Right to Rectification">
                <p>You have the right to have inaccurate personal data corrected, or incomplete data completed. You may update your name, phone number, and email address directly from your Account page. For other corrections, contact us.</p>
              </Sub>

              <Sub title="Right to Erasure">
                <p>You have the right to request the deletion of your personal data where it is no longer necessary for the purposes for which it was collected, or where you withdraw consent. Note that we may be required to retain certain data (such as order records) for legal compliance purposes even after an erasure request.</p>
              </Sub>

              <Sub title="Right to Data Portability">
                <p>You have the right to receive your personal data in a structured, commonly used, machine-readable format, and to transmit it to another controller where technically feasible.</p>
              </Sub>

              <Sub title="Right to Object">
                <p>You have the right to object to the processing of your personal data where we rely on legitimate interests as our legal basis. You also have the unconditional right to object to direct marketing at any time by clicking "Unsubscribe" in any email we send.</p>
              </Sub>

              <Sub title="Right to Withdraw Consent">
                <p>Where we process your data based on your consent (e.g. marketing emails), you have the right to withdraw that consent at any time. Withdrawal does not affect the lawfulness of processing carried out before withdrawal.</p>
              </Sub>

              <Sub title="Right to Lodge a Complaint">
                <p>If you believe we have not handled your personal data in accordance with the PDPA 2019, you have the right to lodge a complaint with the <strong style={{ color: '#F2EAD8' }}>National Information Technology Authority Uganda (NITA-U)</strong>, which is the supervisory authority for data protection in Uganda.</p>
              </Sub>
            </Section>

            <Section title="10. Children's Privacy">
              <p>Our services are not directed at children under the age of 13. We do not knowingly collect personal data from anyone under 13. If you believe a child under 13 has provided us with their personal data, please contact us at <strong style={{ color: '#F2EAD8' }}>privacy@haiq.ug</strong> and we will delete that data promptly.</p>
              <p>Users aged 13–17 should have a parent or guardian review this policy before using our services.</p>
            </Section>

            <Section title="11. International Data Transfers">
              <p>Your data is processed and stored on servers located outside Uganda (Neon on AWS, Resend's infrastructure). When transferring data internationally, we take steps to ensure it is protected to the same standard as required by the PDPA 2019, including relying on processors that maintain appropriate security certifications and contractual data protection obligations.</p>
            </Section>

            <Section title="12. Changes to This Policy">
              <p>We may update this Privacy Policy from time to time to reflect changes in our practices, services, or legal requirements. When we make significant changes, we will update the "Last Updated" date at the top of this page and, where appropriate, notify you by email.</p>
              <p>Your continued use of our website after any changes constitutes your acceptance of the updated policy. We encourage you to review this policy periodically.</p>
            </Section>

            <Section title="13. Contact Us">
              <p>If you have any questions, concerns, or requests regarding this Privacy Policy or the handling of your personal data, please contact us:</p>
              <div className="p-4 mt-3" style={{ background: 'rgba(184,117,42,0.08)', border: '1px solid rgba(184,117,42,0.2)' }}>
                <p><strong style={{ color: '#F2EAD8' }}>HAIQ Bakery — Privacy</strong></p>
                <p>Muyenga, Kampala, Uganda</p>
                <p>Email: <a href="mailto:privacy@haiq.ug" style={{ color: '#B8752A' }}>privacy@haiq.ug</a></p>
                <p>Website: <a href="https://haiq.ug/contact" style={{ color: '#B8752A' }}>haiq.ug/contact</a></p>
              </div>
              <p>We aim to respond to all privacy requests within <strong style={{ color: '#F2EAD8' }}>21 working days</strong>. For complex requests, we will notify you if we need more time.</p>
            </Section>

          </div>
        </div>
      </div>
    </>
  )
}
