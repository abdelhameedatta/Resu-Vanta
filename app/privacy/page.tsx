import PolicyLayout from '../components/PolicyLayout';

export const metadata = { title: 'Privacy Policy – ResuVanta', description: 'How ResuVanta collects, uses, and protects your personal data.' };

export default function PrivacyPage() {
  return (
    <PolicyLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>Privacy Policy</h1>
        <p style={{ color: '#999', fontSize: 13, margin: '0 0 40px' }}>Last updated: June 2025</p>

        <Section title="1. Information We Collect">
          When you use ResuVanta, we collect information you provide directly, including your name, email address, CV content, and payment information. Payment data is handled entirely by our payment processor and is never stored on our servers.
        </Section>

        <Section title="2. How We Use Your Information">
          We use your information to deliver the service you purchased, send your completed CV to your email address, respond to support requests, and improve our platform.
        </Section>

        <Section title="3. Data Storage">
          CV content is processed temporarily to generate your output and is not permanently stored on our servers after delivery. Your email address is retained only to send you your CV and any relevant service communications.
        </Section>

        <Section title="4. Data Sharing">
          We do not sell, rent, or trade your personal data to third parties. Data is only shared with trusted service providers as necessary to deliver our services.
        </Section>

        <Section title="5. Cookies">
          ResuVanta uses minimal session storage to track your service status within a single browser session. This data is cleared when you close your browser tab.
        </Section>

        <Section title="6. Your Rights">
          You have the right to request deletion of your personal data. To make a request, contact us at <a href="mailto:support@resuvanta.com" style={{ color: '#2DB34A' }}>support@resuvanta.com</a>. We will respond within 30 days.
        </Section>

        <Section title="7. Security">
          We implement industry-standard security measures to protect your data. All data transmission is encrypted via HTTPS. Payment processing is PCI-DSS compliant.
        </Section>

        <Section title="8. Children's Privacy">
          ResuVanta does not verify the age of its users. We are not responsible if a person under the age of 18 accesses or uses our website.
        </Section>

        <Section title="9. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify users of significant changes by posting a notice on our website. Continued use of our services constitutes acceptance of the updated policy.
        </Section>

        <Section title="10. Contact">
          For privacy-related questions, contact us at <a href="mailto:support@resuvanta.com" style={{ color: '#2DB34A' }}>support@resuvanta.com</a>.
        </Section>
      </div>
    </PolicyLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 10px', color: '#1C1A16' }}>{title}</h2>
      <p style={{ fontSize: 14, color: '#444', lineHeight: 1.75, margin: 0 }}>{children}</p>
    </div>
  );
}
