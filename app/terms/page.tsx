import PolicyLayout from '../components/PolicyLayout';

export const metadata = { title: 'Terms of Service – ResuVanta', description: 'Terms and conditions for using ResuVanta services.' };

export default function TermsPage() {
  return (
    <PolicyLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>Terms of Service</h1>
        <p style={{ color: '#999', fontSize: 13, margin: '0 0 40px' }}>Last updated: June 2025</p>

        <Section title="1. Acceptance of Terms">
          By accessing or using ResuVanta (resuvanta.com), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.
        </Section>

        <Section title="2. Description of Services">
          ResuVanta provides professional CV and LinkedIn profile optimization services, each available as a one-time purchase.
        </Section>

        <Section title="3. Payment and Pricing">
          All services are offered at a one-time fee with no recurring charges. Payments are processed securely through Paddle, our authorized Merchant of Record. By completing a purchase, you authorize the charge to your selected payment method.
        </Section>

        <Section title="4. Refund Policy">
          All sales are final. Due to the digital and immediate nature of our services, refunds are not issued once payment is completed. If you experience a technical issue, please contact us at <a href="mailto:support@resuvanta.com" style={{ color: '#2DB34A' }}>support@resuvanta.com</a> and we will do our best to resolve it.
        </Section>

        <Section title="5. User Responsibilities">
          You are responsible for the accuracy of the information you provide. ResuVanta optimizes the content you submit — we do not verify the truthfulness of any CV content. You must not submit content that is fraudulent, illegal, or violates third-party rights.
        </Section>

        <Section title="6. Intellectual Property">
          The CV content generated for you is yours. The ResuVanta platform, design, and technology remain the intellectual property of ResuVanta. You may not reproduce, resell, or redistribute our platform or tools.
        </Section>

        <Section title="7. Limitation of Liability">
          ResuVanta provides services on an "as is" basis. We do not guarantee job placement or interview success. To the maximum extent permitted by law, ResuVanta is not liable for any indirect, incidental, or consequential damages arising from use of our services.
        </Section>

        <Section title="8. Privacy">
          Your use of ResuVanta is also governed by our <a href="/privacy" style={{ color: '#2DB34A' }}>Privacy Policy</a>. We do not sell your personal data to third parties.
        </Section>

        <Section title="9. Changes to Terms">
          We reserve the right to modify these Terms at any time. Continued use of our services after changes constitutes acceptance of the revised Terms.
        </Section>

        <Section title="10. Contact">
          For any questions regarding these Terms, please contact us at <a href="mailto:support@resuvanta.com" style={{ color: '#2DB34A' }}>support@resuvanta.com</a>.
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
