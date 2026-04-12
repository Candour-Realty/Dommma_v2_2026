import React from 'react';
import MainLayout from '../components/layout/MainLayout';

const PrivacyPolicy = () => {
  const lastUpdated = "April 10, 2026";

  return (
    <MainLayout hideNovaButton>
      <div className="bg-[#1A2F3A] py-20 text-center">
        <p className="text-xs text-[#C4A962] uppercase tracking-widest mb-4">Legal</p>
        <h1 className="display-lg text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Privacy Policy</h1>
        <p className="text-white/60 mt-4">Last updated: {lastUpdated}</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-lg max-w-none dark:text-gray-300">

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>1. Introduction</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              DOMMMA Inc. ("DOMMMA", "we", "us", or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform at dommma.com and our related services.
            </p>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
              This policy complies with the <strong>Personal Information Protection and Electronic Documents Act (PIPEDA)</strong>, British Columbia's <strong>Personal Information Protection Act (PIPA)</strong>, and aligns with <strong>ISO/IEC 27001</strong> information security management standards.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>2. Information We Collect</h2>
            <h3 className="text-lg font-semibold text-[#1A2F3A] dark:text-white mt-6 mb-2">2.1 Information You Provide</h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li><strong>Account Information:</strong> Name, email address, phone number, user type (renter, landlord, contractor)</li>
              <li><strong>Property Information:</strong> Listing details, addresses, photos, pricing, amenities</li>
              <li><strong>Application Data:</strong> Employment details, income, references (for rental applications)</li>
              <li><strong>Payment Information:</strong> Processed securely through Stripe; we do not store credit card numbers</li>
              <li><strong>Documents:</strong> Lease agreements, identification documents uploaded for verification</li>
              <li><strong>Communications:</strong> Messages between users, support inquiries</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#1A2F3A] dark:text-white mt-6 mb-2">2.2 Information Collected Automatically</h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li><strong>Usage Data:</strong> Pages visited, features used, search queries (via Firebase Analytics)</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
              <li><strong>Location Data:</strong> Approximate location from IP address; precise location only with your explicit consent (for "Use My Location" feature via Google Maps)</li>
              <li><strong>Cookies:</strong> Session cookies for authentication; analytics cookies with your consent</li>
            </ul>
            <h3 className="text-lg font-semibold text-[#1A2F3A] dark:text-white mt-6 mb-2">2.3 Information from Third Parties</h3>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li><strong>Google Maps:</strong> Address autocomplete, geocoding, Street View imagery</li>
              <li><strong>Stripe:</strong> Payment processing status and transaction records</li>
              <li><strong>DocuSign:</strong> Document signing status</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>To provide, maintain, and improve our platform and services</li>
              <li>To process property listings, rental applications, and payments</li>
              <li>To match contractors with relevant job opportunities</li>
              <li>To power AI features including Nova AI assistant, smart pricing, document review, and property valuation (processed via Anthropic Claude AI)</li>
              <li>To send transactional emails (confirmations, notifications, reminders)</li>
              <li>To analyze platform usage and improve user experience</li>
              <li>To comply with legal obligations and enforce our terms</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>4. How We Share Your Information</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">We do not sell your personal information. We share data only in these circumstances:</p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2 mt-3">
              <li><strong>Between Users:</strong> Landlords can see renter applications; contractors see job details; messaging is between consenting parties</li>
              <li><strong>Service Providers:</strong> Stripe (payments), Resend (emails), Google (maps), Firebase (analytics), Cloudflare (storage), DocuSign (e-signatures), Anthropic (AI processing)</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>5. Data Retention</h2>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li>Account data is retained while your account is active</li>
              <li>Transaction records are retained for 7 years (tax and legal compliance)</li>
              <li>Messages are retained for 2 years after the last activity</li>
              <li>You may request deletion of your account and data at any time</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>6. Your Rights Under PIPEDA</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Under Canadian privacy law, you have the right to:</p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2 mt-3">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (right to be forgotten)</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent for data processing at any time</li>
              <li><strong>Complaint:</strong> File a complaint with the Office of the Privacy Commissioner of Canada</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
              To exercise these rights, contact us at <a href="mailto:privacy@dommma.com" className="text-[#1A2F3A] dark:text-[#C4A962] underline">privacy@dommma.com</a>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>7. Data Security</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We implement industry-standard security measures aligned with ISO 27001:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2 mt-3">
              <li>HTTPS/TLS encryption for all data in transit</li>
              <li>Passwords hashed with bcrypt (never stored in plaintext)</li>
              <li>Payment data processed by PCI DSS Level 1 certified Stripe</li>
              <li>Database encryption at rest (MongoDB Atlas)</li>
              <li>File storage encrypted via Cloudflare R2</li>
              <li>Regular security audits and access controls</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
              For more details, see our <a href="/security" className="text-[#1A2F3A] dark:text-[#C4A962] underline">Security Page</a>.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>8. Cookies</h2>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2">
              <li><strong>Essential Cookies:</strong> Required for authentication and session management</li>
              <li><strong>Analytics Cookies:</strong> Firebase Analytics for usage patterns (can be declined)</li>
              <li><strong>Preference Cookies:</strong> Theme (dark/light mode), language preference</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mt-3">
              We do not use advertising cookies or share cookie data with advertisers.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>9. AI Data Processing</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              DOMMMA uses artificial intelligence (Anthropic Claude) to power features such as property search, document review, smart pricing, and the Nova AI assistant. When you use these features:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-gray-400 space-y-2 mt-3">
              <li>Your queries are processed by Anthropic's API and are not used to train AI models</li>
              <li>Property data used for AI analysis is limited to what's needed for the specific feature</li>
              <li>AI-generated content (descriptions, valuations) is clearly labeled</li>
              <li>You can opt out of AI features by contacting us</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>10. Third-Party Services</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-gray-600 dark:text-gray-400 mt-3">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 pr-4 font-semibold text-[#1A2F3A] dark:text-white">Service</th>
                    <th className="text-left py-3 pr-4 font-semibold text-[#1A2F3A] dark:text-white">Purpose</th>
                    <th className="text-left py-3 font-semibold text-[#1A2F3A] dark:text-white">Privacy Policy</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Stripe", "Payment processing", "https://stripe.com/privacy"],
                    ["Google Maps", "Maps, geocoding, Street View", "https://policies.google.com/privacy"],
                    ["Firebase", "Analytics, push notifications", "https://firebase.google.com/support/privacy"],
                    ["Resend", "Transactional emails", "https://resend.com/privacy"],
                    ["Cloudflare R2", "File storage", "https://www.cloudflare.com/privacypolicy/"],
                    ["DocuSign", "E-signatures", "https://www.docusign.com/privacy"],
                    ["Anthropic", "AI processing (Claude)", "https://www.anthropic.com/privacy"],
                    ["MongoDB Atlas", "Database", "https://www.mongodb.com/legal/privacy-policy"],
                  ].map(([service, purpose, url], i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 pr-4 font-medium">{service}</td>
                      <td className="py-3 pr-4">{purpose}</td>
                      <td className="py-3"><a href={url} target="_blank" rel="noopener noreferrer" className="text-[#1A2F3A] dark:text-[#C4A962] underline">View</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>11. Children's Privacy</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              DOMMMA is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>12. Changes to This Policy</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of material changes by email and/or by posting a notice on our platform. Your continued use of DOMMMA after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-12 p-6 bg-[#F5F5F0] dark:bg-white/5 rounded-2xl">
            <h2 className="text-2xl font-semibold text-[#1A2F3A] dark:text-white mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>13. Contact Us</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              If you have questions about this Privacy Policy or want to exercise your privacy rights:
            </p>
            <div className="mt-4 space-y-2 text-gray-600 dark:text-gray-400">
              <p><strong>Privacy Officer:</strong> DOMMMA Inc.</p>
              <p><strong>Email:</strong> <a href="mailto:privacy@dommma.com" className="text-[#1A2F3A] dark:text-[#C4A962] underline">privacy@dommma.com</a></p>
              <p><strong>Address:</strong> Vancouver, BC, Canada</p>
              <p><strong>Website:</strong> <a href="https://dommma.com" className="text-[#1A2F3A] dark:text-[#C4A962] underline">dommma.com</a></p>
            </div>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-4">
              You may also file a complaint with the <a href="https://www.priv.gc.ca" target="_blank" rel="noopener noreferrer" className="underline">Office of the Privacy Commissioner of Canada</a>.
            </p>
          </section>

        </div>
      </div>
    </MainLayout>
  );
};

export default PrivacyPolicy;
