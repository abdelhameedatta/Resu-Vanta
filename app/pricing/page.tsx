import PolicyLayout from '../components/PolicyLayout';

export const metadata = { title: 'Pricing – ResuVanta', description: 'Simple, transparent pricing for professional CV services.' };

const plans = [
  {
    name: 'CV Optimization',
    price: '$7.99',
    description: 'Transform your existing CV into an ATS-ready document.',
    features: [
      'Full ATS keyword analysis',
      'Professional summary rewrite',
      'Experience section enhancement',
      'Skills gap analysis',
      'ATS score with justification',
      '3 suggested achievements',
      'Downloadable PDF CV',
      'CV emailed to you',
    ],
  },
  {
    name: 'CV Builder + Optimization',
    price: '$11.99',
    description: 'Build a complete professional CV from scratch.',
    features: [
      'CV generated from your data',
      'ATS-optimised structure',
      'Smart soft & technical skills',
      'Multiple education entries',
      'Additional info generation',
      'Downloadable PDF CV',
      'CV emailed to you',
    ],
    highlight: true,
  },
  {
    name: 'LinkedIn Optimization',
    price: '$6.99',
    description: 'Optimise your LinkedIn profile to attract recruiters.',
    features: [
      'Professional headline (220 chars)',
      'Full About section rewrite',
      'Top 10 skills keywords',
      '15–20 recruiter search keywords',
      'First-person compelling tone',
    ],
  },
];

export default function PricingPage() {
  return (
    <PolicyLayout>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 24px 80px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 12px' }}>Simple, Transparent Pricing</h1>
          <p style={{ fontSize: 16, color: '#666', margin: 0 }}>One-time payment. No subscriptions. No hidden fees.</p>
        </div>

        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{
              background: plan.highlight ? '#1C1A16' : '#fff',
              color: plan.highlight ? '#F8F6F1' : '#1C1A16',
              border: `1px solid ${plan.highlight ? '#1C1A16' : '#E5E0D6'}`,
              borderRadius: 16,
              padding: '36px 32px',
              flex: '1 1 280px',
              maxWidth: 320,
              position: 'relative',
            }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: '#2DB34A', color: '#fff', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 20 }}>
                  MOST POPULAR
                </div>
              )}
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{plan.name}</h2>
              <p style={{ fontSize: 13, color: plan.highlight ? '#ccc' : '#666', margin: '0 0 20px', lineHeight: 1.5 }}>{plan.description}</p>
              <div style={{ fontSize: 40, fontWeight: 800, margin: '0 0 24px' }}>{plan.price}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: `1px solid ${plan.highlight ? '#333' : '#E5E0D6'}`, fontSize: 14, color: plan.highlight ? '#eee' : '#333' }}>
                    <span style={{ color: '#2DB34A', fontWeight: 700, flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/" style={{
                display: 'block', textAlign: 'center', padding: '14px',
                background: plan.highlight ? '#2DB34A' : '#1C1A16',
                color: '#fff', textDecoration: 'none',
                borderRadius: 10, fontWeight: 700, fontSize: 15,
              }}>
                Unlock {plan.name} →
              </a>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#999', fontSize: 13, marginTop: 48 }}>
          All prices are in USD. Payments are processed securely via Paddle.{' '}
          Questions? <a href="mailto:support@resuvanta.com" style={{ color: '#2DB34A' }}>support@resuvanta.com</a>
        </p>
      </div>
    </PolicyLayout>
  );
}
