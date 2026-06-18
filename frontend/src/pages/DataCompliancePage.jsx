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

function TableHeader({ cols }) {
  return (
    <thead>
      <tr style={{ background: 'rgba(184,117,42,0.12)' }}>
        {cols.map(c => (
          <th key={c} className="text-left p-3 font-semibold text-xs" style={{ color: '#E8C88A', border: '1px solid rgba(184,117,42,0.2)' }}>{c}</th>
        ))}
      </tr>
    </thead>
  )
}

function TableRow({ cells, i }) {
  return (
    <tr style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(184,117,42,0.04)' }}>
      {cells.map((cell, j) => (
        <td key={j} className="p-3 text-xs align-top" style={{ color: j === 0 ? 'rgba(242,234,216,0.8)' : 'rgba(242,234,216,0.6)', border: '1px solid rgba(184,117,42,0.15)' }}>
          {cell}
        </td>
      ))}
    </tr>
  )
}

export default function DataCompliancePage() {
  return (
    <>
      <SEO
        title="Data & Compliance | HAIQ"
        description="HAIQ Bakery's data protection practices, retention schedules, security measures, and your rights under the Uganda Data Protection and Privacy Act 2019."
      />
      <div style={{ background: '#1A0A00', minHeight: '100vh' }} className="px-6 py-16">
        <div className="max-w-3xl mx-auto">

          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase mb-2" style={{ color: '#B8752A' }}>Legal</p>
          <h1 className="font-serif font-bold text-4xl mb-2" style={{ color: '#F2EAD8' }}>Data & Compliance</h1>
          <div className="w-8 h-px mb-6" style={{ background: '#B8752A' }} />
          <p className="text-xs mb-10" style={{ color: '#8C7355' }}>
            Effective Date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Last Updated: {LAST_UPDATED}
          </p>

          <p className="text-sm leading-relaxed mb-10" style={{ color: 'rgba(242,234,216,0.7)' }}>
            HAIQ Bakery is committed to full compliance with the <strong style={{ color: '#F2EAD8' }}>Uganda Data Protection and Privacy Act 2019 (PDPA)</strong> and its Regulations. This page is a technical and legal reference explaining exactly what personal data we hold, where it is stored, how long we keep it, what security controls we apply, and what rights you have. For a plain-language summary of how we use your data day-to-day, see our <Link to="/privacy" style={{ color: '#B8752A' }}>Privacy Policy</Link>.
          </p>

          <div style={{ borderTop: '1px solid rgba(184,117,42,0.15)' }} className="pt-10">

            <Section title="1. Legal Framework">
              <p>HAIQ Bakery processes personal data in accordance with the following legislation and regulations:</p>
              <List items={[
                'Uganda Data Protection and Privacy Act 2019 (Act No. 9 of 2019)',
                'Data Protection and Privacy Regulations 2021 (Statutory Instrument 2021 No. 26)',
                'Uganda Computer Misuse Act 2011',
                'Uganda Electronic Transactions Act 2011',
              ]} />
              <p>The supervisory authority for data protection in Uganda is <strong style={{ color: '#F2EAD8' }}>NITA-Uganda (National Information Technology Authority — Uganda)</strong>, through which the Personal Data Protection Office (PDPO) operates.</p>
            </Section>

            <Section title="2. Data Controller Details">
              <div className="p-4" style={{ background: 'rgba(184,117,42,0.08)', border: '1px solid rgba(184,117,42,0.2)' }}>
                <p><strong style={{ color: '#F2EAD8' }}>Organisation:</strong> HAIQ Bakery</p>
                <p><strong style={{ color: '#F2EAD8' }}>Role:</strong> Data Controller</p>
                <p><strong style={{ color: '#F2EAD8' }}>Address:</strong> Muyenga, Kampala, Uganda</p>
                <p><strong style={{ color: '#F2EAD8' }}>Data Contact:</strong> <a href="mailto:privacy@haiq.ug" style={{ color: '#B8752A' }}>privacy@haiq.ug</a></p>
              </div>
            </Section>

            <Section title="3. Personal Data We Hold">
              <p>The following table documents every category of personal data we collect, the source of that data, and its processing purpose:</p>

              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse">
                  <TableHeader cols={['Data Category', 'Specific Fields', 'Source', 'Purpose']} />
                  <tbody>
                    {[
                      [
                        'Account Identity',
                        'First name, last name, email address, phone number, bcrypt-hashed password',
                        'User-provided at registration',
                        'Account management, authentication, order attribution',
                      ],
                      [
                        'Order Records',
                        'Order ID, order number, tracking token, items ordered (product name, variant, quantity), line totals, order total, delivery zone, delivery fee, order status, timestamps',
                        'User-provided at checkout',
                        'Order fulfilment, status tracking, customer support, legal records',
                      ],
                      [
                        'Delivery Address',
                        'Full delivery address text, delivery zone identifier',
                        'User-provided at checkout',
                        'Delivery routing and fulfilment',
                      ],
                      [
                        'Contact Messages',
                        'Name, email, message body, submission timestamp',
                        'User-provided via Contact form',
                        'Customer support and enquiry resolution',
                      ],
                      [
                        'Newsletter Subscription',
                        'Email address, subscription status, subscription date',
                        'User-provided via opt-in',
                        'Email marketing (consent-based)',
                      ],
                      [
                        'Product Reviews',
                        'Display name (from account), star rating, review text, submission date, verified_purchase flag',
                        'User-provided via product review form',
                        'Product feedback, public display on product pages',
                      ],
                      [
                        'Server / Infrastructure Logs',
                        'IP address, HTTP method, URL path, HTTP status code, response time, timestamp',
                        'Automatically generated on each request',
                        'Security monitoring, error diagnostics',
                      ],
                    ].map((row, i) => <TableRow key={i} cells={row} i={i} />)}
                  </tbody>
                </table>
              </div>

              <p className="mt-4"><strong style={{ color: '#F2EAD8' }}>Data we explicitly do NOT collect:</strong></p>
              <List items={[
                'Payment card numbers or banking credentials (we are Cash on Delivery only)',
                'Mobile money PINs or transaction credentials',
                'Government-issued identification numbers (National ID, passport)',
                'Biometric data of any kind',
                'Health or medical data',
                'Racial, ethnic, religious, or political data',
                'Precise real-time GPS location (only the delivery address you type)',
                'Data relating to children under 13',
              ]} />
            </Section>

            <Section title="4. Data Storage Architecture">
              <p>All personal data flows through the following infrastructure:</p>

              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse">
                  <TableHeader cols={['Component', 'Provider', 'Function', 'Data Stored', 'Region']} />
                  <tbody>
                    {[
                      ['PostgreSQL Database', 'Neon (neon.tech)', 'Primary data store', 'All user, order, review, and message data', 'AWS us-east-1'],
                      ['API Backend', 'Render (render.com)', 'Application server', 'In-flight request data only; no persistent storage', 'US (Oregon)'],
                      ['Frontend', 'Vercel (vercel.com)', 'Static web hosting', 'No user data stored', 'Global CDN'],
                      ['Email Delivery', 'Resend (resend.com)', 'Transactional & campaign email', 'Email address, email content per send', 'US'],
                    ].map((row, i) => <TableRow key={i} cells={row} i={i} />)}
                  </tbody>
                </table>
              </div>

              <p className="mt-4"><strong style={{ color: '#F2EAD8' }}>Data-at-rest encryption:</strong> Neon encrypts all data at rest using AES-256. Render's ephemeral environment does not persist any user data between requests.</p>
              <p><strong style={{ color: '#F2EAD8' }}>Data-in-transit encryption:</strong> All communication between your browser, our CDN, our API, and our database is encrypted via TLS 1.2 or higher (HTTPS). Plaintext HTTP connections are redirected to HTTPS.</p>
            </Section>

            <Section title="5. Data Retention Schedule">
              <p>We retain personal data only for as long as necessary for its stated purpose or as required by law. The following schedule is binding on our operations:</p>

              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse">
                  <TableHeader cols={['Data Category', 'Retention Period', 'Legal Basis for Period', 'Deletion Method']} />
                  <tbody>
                    {[
                      ['Account identity data', '3 years after last login, or on verified erasure request (subject to legal holds)', 'Legitimate interest / contract', 'Hard delete from database; email suppressed'],
                      ['Order records (complete)', '7 years from order date', 'Uganda tax and accounting obligations', 'After 7 years: anonymised (personal fields nulled, order totals retained)'],
                      ['Delivery addresses', '7 years (part of order record)', 'Uganda tax and accounting obligations', 'Anonymised with parent order record after 7 years'],
                      ['Contact form messages', '2 years from submission date', 'Legitimate interest (customer support)', 'Hard delete after retention period'],
                      ['Newsletter subscriptions (active)', 'Until unsubscription', 'Consent', 'On unsubscribe: status set to unsubscribed; email retained on suppression list for 12 months'],
                      ['Newsletter suppression list', '12 months post-unsubscription', 'Legitimate interest (prevent re-subscription without consent)', 'Hard delete after 12 months'],
                      ['Product reviews', 'Duration of account; deleted on account erasure', 'Legitimate interest (public record)', 'Hard delete with account'],
                      ['Server / infrastructure logs', '30 days', 'Legitimate interest (security)', 'Automatic rotation by infrastructure provider'],
                      ['Authentication tokens (JWTs)', 'Expires at token expiry time (session-scoped)', 'Contract / session management', 'Client-side; not stored server-side'],
                    ].map((row, i) => <TableRow key={i} cells={row} i={i} />)}
                  </tbody>
                </table>
              </div>

              <p className="mt-4">At the end of a retention period, data is either permanently and irreversibly deleted from our database, or it is anonymised such that it can no longer be linked to any identifiable individual. We do not archive personal data beyond the periods stated above.</p>
            </Section>

            <Section title="6. Security Controls">
              <p>We implement the following technical and organisational security measures:</p>

              <div className="space-y-4 mt-2">
                <div>
                  <p className="font-semibold text-sm mb-1.5" style={{ color: '#F2EAD8' }}>Authentication and Access Control</p>
                  <List items={[
                    'Passwords are stored exclusively as bcrypt hashes (minimum cost factor 10); we never store, log, or transmit plain-text passwords',
                    'Authentication uses short-lived JSON Web Tokens (JWTs); tokens are stored in the browser\'s local storage and sent as Bearer tokens — no server-side session storage',
                    'Admin access is secured with separate credentials and is not available to customer accounts',
                    'Access to the production database is restricted to our backend API only; no direct public access is permitted',
                    'All admin operations that modify data require valid admin-scoped JWT authentication',
                  ]} />
                </div>

                <div>
                  <p className="font-semibold text-sm mb-1.5" style={{ color: '#F2EAD8' }}>Input Validation and Injection Prevention</p>
                  <List items={[
                    'All user input is validated on the server side using a schema-based validator (Zod) before any processing occurs',
                    'All database queries use parameterised statements via the pg library — SQL injection is structurally prevented',
                    'HTML content in user-supplied fields (reviews, messages, cancellation reasons) is detected and rejected before storage',
                    'Strict UUID validation is enforced on all resource identifiers to prevent object reference manipulation',
                  ]} />
                </div>

                <div>
                  <p className="font-semibold text-sm mb-1.5" style={{ color: '#F2EAD8' }}>Network Security</p>
                  <List items={[
                    'All HTTP traffic is served over HTTPS with TLS 1.2 or higher',
                    'CORS (Cross-Origin Resource Sharing) is configured to allow requests only from our authorised frontend domains',
                    'API rate limiting is applied to prevent brute-force and abuse',
                  ]} />
                </div>

                <div>
                  <p className="font-semibold text-sm mb-1.5" style={{ color: '#F2EAD8' }}>Operational Security</p>
                  <List items={[
                    'Infrastructure credentials (database connection strings, API keys, JWT secrets) are stored as environment variables; they are never committed to source control',
                    'Access to production environment variables is limited to authorised developers only',
                    'No payment data is processed or stored by us — eliminating an entire class of payment-related security risk',
                  ]} />
                </div>
              </div>
            </Section>

            <Section title="7. Third-Party Processor Agreements">
              <p>We share data with the following sub-processors, each of whom is contractually bound to handle data securely and only on our documented instructions:</p>

              <div className="overflow-x-auto mt-4">
                <table className="w-full border-collapse">
                  <TableHeader cols={['Processor', 'Website', 'Data Shared', 'Purpose', 'Security Certification']} />
                  <tbody>
                    {[
                      ['Neon', 'neon.tech', 'All user and order data', 'PostgreSQL database hosting', 'SOC 2 Type II (via AWS)'],
                      ['Render', 'render.com', 'In-flight request data', 'API hosting', 'SOC 2 Type II'],
                      ['Vercel', 'vercel.com', 'No personal data stored', 'Frontend hosting / CDN', 'SOC 2 Type II'],
                      ['Resend', 'resend.com', 'Email address, name, email content', 'Transactional and campaign email delivery', 'SOC 2 Type II'],
                    ].map((row, i) => <TableRow key={i} cells={row} i={i} />)}
                  </tbody>
                </table>
              </div>

              <p className="mt-4">We do not share personal data with any other parties. We do not sell personal data. We do not use advertising networks, tracking pixels, or third-party analytics services.</p>
            </Section>

            <Section title="8. International Data Transfers">
              <p>Because our infrastructure providers are based in the United States, personal data you provide is transferred to and processed in the United States. The PDPA 2019 requires that international transfers of personal data occur only to countries or organisations offering an adequate level of protection.</p>
              <p>We address this by:</p>
              <List items={[
                'Selecting processors (Neon, Render, Vercel, Resend) who maintain internationally recognised security certifications (SOC 2 Type II)',
                'Ensuring contractual data processing agreements are in place with each processor',
                'Minimising the categories of data transferred to only what is strictly necessary for each processor\'s function',
              ]} />
            </Section>

            <Section title="9. Your Rights Under the PDPA 2019">
              <p>The Uganda Data Protection and Privacy Act 2019 grants you the following rights. To exercise any right, contact us at <a href="mailto:privacy@haiq.ug" style={{ color: '#B8752A' }}>privacy@haiq.ug</a> with the subject line "Data Rights Request." We will verify your identity before processing any request and respond within <strong style={{ color: '#F2EAD8' }}>21 working days</strong>.</p>

              <div className="space-y-4 mt-2">
                {[
                  ['Right of Access (Section 20, PDPA)', 'You may request confirmation of whether we hold personal data about you, a description of the data, the purposes for which it is processed, and a copy of the data itself.'],
                  ['Right to Rectification (Section 21, PDPA)', 'You may request correction of inaccurate personal data or completion of incomplete data. You can update your name, phone number, and email directly from your Account page for most fields.'],
                  ['Right to Erasure (Section 24, PDPA)', 'You may request the deletion of your personal data where it is no longer necessary for the purposes for which it was collected, where you have withdrawn consent (and no other legal basis applies), or where processing is unlawful. Note: order records must be retained for 7 years for tax compliance and may not be fully deleted on request.'],
                  ['Right to Data Portability (Section 25, PDPA)', 'You may request your personal data in a structured, commonly used, machine-readable format (JSON or CSV) where technically feasible.'],
                  ['Right to Object (Section 26, PDPA)', 'You may object to the processing of your personal data where we rely on legitimate interests as our legal basis. You have an unconditional right to object to direct marketing at any time by clicking "Unsubscribe" in any email we send you.'],
                  ['Right to Withdraw Consent', 'Where processing is based on your consent (e.g. newsletter marketing), you may withdraw consent at any time. Withdrawal does not affect the lawfulness of processing prior to withdrawal.'],
                  ['Right to Lodge a Complaint', 'If you believe we have violated your rights under the PDPA 2019, you may file a complaint with the Personal Data Protection Office (PDPO), NITA-Uganda, Palm Courts, Plot 7A Rotary Avenue, Kololo, Kampala, Uganda. Website: nita.go.ug.'],
                ].map(([right, desc], i) => (
                  <div key={i}>
                    <p className="font-semibold text-sm mb-1" style={{ color: '#F2EAD8' }}>{right}</p>
                    <p>{desc}</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="10. Data Breach Response Procedure">
              <p>In the event of a personal data breach, HAIQ Bakery will:</p>
              <List items={[
                'Immediately contain the breach and assess the nature and scope of the incident',
                'Notify affected users without undue delay — and in any case within 72 hours of becoming aware — where the breach is likely to result in a risk to their rights and freedoms',
                'Notify the Personal Data Protection Office (PDPO) / NITA-Uganda where required by the PDPA 2019',
                'Document the breach, its effects, and the remedial actions taken in an internal incident register',
                'Take corrective technical and organisational measures to prevent recurrence',
              ]} />
              <p>If you suspect that your HAIQ account has been compromised, please contact us immediately at <a href="mailto:privacy@haiq.ug" style={{ color: '#B8752A' }}>privacy@haiq.ug</a> and change your password via the "Forgot Password" link on the login page.</p>
            </Section>

            <Section title="11. Children's Data">
              <p>We do not knowingly collect or process personal data from children under the age of 13. Our platform is not directed at children. If we become aware that we have inadvertently collected data from a child under 13, we will delete it promptly. If you believe a child under 13 has used our platform, please notify us at <a href="mailto:privacy@haiq.ug" style={{ color: '#B8752A' }}>privacy@haiq.ug</a>.</p>
            </Section>

            <Section title="12. Updates to This Page">
              <p>This page is updated whenever our data practices, infrastructure, or applicable legal requirements change. The "Last Updated" date at the top reflects the most recent revision. Material changes will be communicated to users via email and/or a notice on the website.</p>
            </Section>

            <Section title="13. Contact and Regulatory Authority">
              <div className="grid sm:grid-cols-2 gap-4 mt-2">
                <div className="p-4" style={{ background: 'rgba(184,117,42,0.08)', border: '1px solid rgba(184,117,42,0.2)' }}>
                  <p className="font-semibold text-xs mb-2" style={{ color: '#B8752A' }}>HAIQ BAKERY — DATA CONTACT</p>
                  <p>Muyenga, Kampala, Uganda</p>
                  <p>Email: <a href="mailto:privacy@haiq.ug" style={{ color: '#B8752A' }}>privacy@haiq.ug</a></p>
                  <p>Response time: 21 working days</p>
                </div>
                <div className="p-4" style={{ background: 'rgba(184,117,42,0.08)', border: '1px solid rgba(184,117,42,0.2)' }}>
                  <p className="font-semibold text-xs mb-2" style={{ color: '#B8752A' }}>SUPERVISORY AUTHORITY</p>
                  <p>Personal Data Protection Office (PDPO)</p>
                  <p>NITA-Uganda</p>
                  <p>Palm Courts, Plot 7A Rotary Avenue</p>
                  <p>Kololo, Kampala, Uganda</p>
                  <p>Website: <span style={{ color: '#B8752A' }}>nita.go.ug</span></p>
                </div>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </>
  )
}
