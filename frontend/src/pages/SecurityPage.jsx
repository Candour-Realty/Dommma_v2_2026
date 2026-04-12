import React from 'react';
import { Shield, Lock, Server, CreditCard, Database, Eye, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import MainLayout from '../components/layout/MainLayout';

const SecurityPage = () => {
  const measures = [
    {
      icon: Lock,
      title: "Encryption in Transit",
      description: "All data transmitted between your browser and our servers is encrypted using TLS 1.3 (HTTPS). Every connection to dommma.com is secured with a valid SSL certificate.",
      details: ["256-bit AES encryption", "HSTS enforced", "Certificate managed via Let's Encrypt / Cloudflare"]
    },
    {
      icon: Shield,
      title: "Authentication Security",
      description: "Your passwords are never stored in plaintext. We use industry-standard bcrypt hashing with salt rounds, making it computationally infeasible to reverse-engineer passwords.",
      details: ["Bcrypt password hashing", "JWT token-based authentication", "Email verification required", "Session management via secure localStorage"]
    },
    {
      icon: CreditCard,
      title: "Payment Security",
      description: "We never see, store, or process your credit card numbers. All payment processing is handled by Stripe, which is PCI DSS Level 1 certified (the highest level of security certification).",
      details: ["PCI DSS Level 1 compliant (via Stripe)", "Stripe Connect for landlord payouts", "No card data stored on our servers", "Tokenized payment methods"]
    },
    {
      icon: Server,
      title: "Infrastructure Security",
      description: "Our platform runs on AWS EC2 in Canada, with Nginx as a reverse proxy, automated deployments via GitHub Actions, and DDoS protection through Cloudflare.",
      details: ["AWS EC2 (Canada region)", "Nginx reverse proxy with rate limiting", "SSH key-based server access only", "Automated CI/CD via GitHub Actions", "Cloudflare DDoS protection"]
    },
    {
      icon: Database,
      title: "Data Storage",
      description: "Your data is stored in MongoDB Atlas with encryption at rest and in transit, automated backups, and network isolation. Files (photos, documents) are stored on Cloudflare R2 with encryption.",
      details: ["MongoDB Atlas with encryption at rest", "Automated daily backups", "Network isolation (IP whitelisting)", "Cloudflare R2 encrypted file storage", "Data residency in North America"]
    },
    {
      icon: Globe,
      title: "Third-Party Security",
      description: "We carefully vet all third-party services we integrate with. Each service must meet our security requirements before integration.",
      details: ["Stripe: PCI DSS Level 1", "Google Maps: SOC 2 certified", "Firebase: ISO 27001 certified", "DocuSign: SOC 1/2, ISO 27001", "Anthropic (Claude AI): SOC 2 Type II", "Resend: SOC 2 certified"]
    },
    {
      icon: Eye,
      title: "AI & Data Privacy",
      description: "Our AI features (Nova assistant, smart pricing, document review) are powered by Anthropic Claude. Your data is processed via API and is not used to train AI models.",
      details: ["Anthropic does not train on API data", "AI queries are not stored by the AI provider", "AI-generated content is clearly labeled", "Opt-out available for AI features"]
    },
    {
      icon: AlertTriangle,
      title: "Incident Response",
      description: "We have an incident response plan to handle security breaches promptly. In the event of a data breach, affected users will be notified within 72 hours as required by PIPEDA.",
      details: ["72-hour breach notification (PIPEDA compliant)", "Dedicated incident response process", "Regular security monitoring", "Access logging and audit trails"]
    },
  ];

  return (
    <MainLayout hideNovaButton>
      <div className="bg-[#1A2F3A] py-20 text-center">
        <p className="text-xs text-[#C4A962] uppercase tracking-widest mb-4">Trust & Safety</p>
        <h1 className="display-lg text-white" style={{ fontFamily: 'Cormorant Garamond, serif' }}>Security</h1>
        <p className="text-white/60 mt-4 max-w-xl mx-auto">How we protect your data and keep the DOMMMA platform secure</p>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16">
        {/* Trust badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          {[
            { label: "HTTPS Encrypted", icon: Lock },
            { label: "PCI DSS Compliant", icon: CreditCard },
            { label: "PIPEDA Compliant", icon: Shield },
            { label: "ISO 27001 Aligned", icon: CheckCircle },
          ].map((badge, i) => (
            <div key={i} className="bg-white dark:bg-[#1A2332] rounded-xl p-5 text-center shadow-sm">
              <badge.icon className="mx-auto mb-2 text-[#1A2F3A] dark:text-[#C4A962]" size={28} />
              <p className="text-sm font-semibold text-[#1A2F3A] dark:text-white">{badge.label}</p>
            </div>
          ))}
        </div>

        {/* Security measures */}
        <div className="space-y-8">
          {measures.map((measure, i) => (
            <div key={i} className="bg-white dark:bg-[#1A2332] rounded-2xl p-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#1A2F3A]/10 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
                  <measure.icon size={24} className="text-[#1A2F3A] dark:text-[#C4A962]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-[#1A2F3A] dark:text-white mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {measure.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{measure.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {measure.details.map((detail, j) => (
                      <span key={j} className="px-3 py-1 bg-[#F5F5F0] dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                        {detail}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Vulnerability reporting */}
        <div className="mt-16 bg-[#1A2F3A] rounded-2xl p-8 text-center">
          <Shield className="mx-auto mb-4 text-[#C4A962]" size={36} />
          <h2 className="text-2xl font-semibold text-white mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Report a Vulnerability
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-6">
            We take security seriously. If you discover a security vulnerability in our platform, please report it responsibly.
          </p>
          <a
            href="mailto:security@dommma.com"
            className="inline-block px-8 py-3 bg-[#C4A962] text-[#1A2F3A] rounded-full font-medium hover:bg-[#d4b972] transition-colors"
          >
            security@dommma.com
          </a>
          <p className="text-white/40 text-sm mt-4">
            We aim to acknowledge reports within 24 hours and will keep you updated on the resolution.
          </p>
        </div>

        {/* Compliance note */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            For our full privacy practices, see our <a href="/privacy" className="text-[#1A2F3A] dark:text-[#C4A962] underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default SecurityPage;
