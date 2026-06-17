import Link from 'next/link';

function BrandLogo() {
  return (
    <div className="logoBlock">
      <svg width="200" height="52" viewBox="0 0 200 52" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="3" width="30" height="38" rx="5" fill="#2DB34A" opacity="0.12"/>
        <rect x="2" y="3" width="30" height="38" rx="5" fill="none" stroke="#2DB34A" strokeWidth="1.5"/>
        <line x1="9" y1="15" x2="25" y2="15" stroke="#2DB34A" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="9" y1="21" x2="25" y2="21" stroke="#2DB34A" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="9" y1="27" x2="18" y2="27" stroke="#2DB34A" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="28" cy="36" r="8" fill="#2DB34A"/>
        <polyline points="23.5,36 27,39.5 33,31" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <text x="44" y="24" fontFamily="-apple-system,sans-serif" fontSize="19" fontWeight="700" letterSpacing="-0.04em" fill="#1C1A16">Resu</text>
        <text x="85" y="24" fontFamily="-apple-system,sans-serif" fontSize="19" fontWeight="700" letterSpacing="-0.04em" fill="#2DB34A">Vanta</text>
        <text x="44" y="40" fontFamily="-apple-system,sans-serif" fontSize="10" fontWeight="400" fill="#bbb" letterSpacing="0.03em">Apply with confidence.</text>
      </svg>
    </div>
  );
}

export default function PolicyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site">
      <header>
        <Link href="/" className="brandButton">
          <BrandLogo />
        </Link>
        <nav>
          <Link href="/" style={{ color: 'inherit', textDecoration: 'none', fontSize: 14 }}>Home</Link>
          <Link href="/pricing" style={{ color: 'inherit', textDecoration: 'none', fontSize: 14 }}>Pricing</Link>
        </nav>
      </header>

      <main style={{ minHeight: '70vh' }}>
        {children}
      </main>

      <footer>
        <p>ResuVanta provides automated CV optimization support only. It does not guarantee interviews, job offers, or hiring decisions.</p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <Link href="/terms" style={{ color: '#aaa', fontSize: 13, textDecoration: 'none' }}>Terms of Service</Link>
          <Link href="/privacy" style={{ color: '#aaa', fontSize: 13, textDecoration: 'none' }}>Privacy Policy</Link>
          <Link href="/refund" style={{ color: '#aaa', fontSize: 13, textDecoration: 'none' }}>Refund Policy</Link>
        </div>
      </footer>
    </div>
  );
}
