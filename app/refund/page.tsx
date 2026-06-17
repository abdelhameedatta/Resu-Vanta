import PolicyLayout from '../components/PolicyLayout';

export const metadata = { title: 'Refund Policy – ResuVanta', description: 'ResuVanta refund and cancellation policy.' };

export default function RefundPage() {
  return (
    <PolicyLayout>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '60px 24px 80px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, margin: '0 0 8px' }}>Refund Policy</h1>
        <p style={{ color: '#999', fontSize: 13, margin: '0 0 40px' }}>Last updated: June 2025</p>

        <div style={{ background: '#fff', border: '1px solid #E5E0D6', borderRadius: 12, padding: '32px', marginBottom: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Our Policy</h2>
          <p style={{ fontSize: 15, color: '#333', lineHeight: 1.8, margin: 0 }}>
            All sales are final. Due to the digital and immediate nature of our services, no refunds are issued once payment is completed and the service has been delivered.
          </p>
        </div>

        <Section title="Why We Have This Policy">
          Our services are delivered instantly upon payment. Because the service is consumed immediately after purchase — and cannot be "returned" — we are unable to offer refunds on completed transactions. This is standard practice for digital services.
        </Section>

        <Section title="Technical Issues">
          If you experience a technical issue that prevented you from receiving your service, please contact us. We will investigate and resolve the issue at no additional charge.
        </Section>

        <Section title="How to Contact Us">
          If you have a problem with your order, please reach out:
        </Section>

        <div style={{ background: '#fff', border: '1px solid #E5E0D6', borderRadius: 12, padding: '24px 28px', marginBottom: 32 }}>
          <p style={{ margin: '0 0 10px', fontSize: 14, color: '#444' }}>
            📧 Email: <a href="mailto:support@resuvanta.com" style={{ color: '#2DB34A', fontWeight: 600 }}>support@resuvanta.com</a>
          </p>
          <p style={{ margin: 0, fontSize: 14, color: '#444' }}>
            💬 Or use the <a href="/#contact" style={{ color: '#2DB34A', fontWeight: 600 }}>Contact Form</a> on our website.
          </p>
          <p style={{ margin: '12px 0 0', fontSize: 13, color: '#999' }}>We respond within 1–2 business days.</p>
        </div>

        <Section title="Chargebacks">
          We encourage you to contact us before initiating a chargeback with your bank. Chargebacks that are found to be unjustified may result in your account being blocked from future services. We are always happy to resolve issues directly.
        </Section>

        <Section title="Changes to This Policy">
          ResuVanta reserves the right to update this Refund Policy at any time. The date of the latest update is shown at the top of this page.
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
