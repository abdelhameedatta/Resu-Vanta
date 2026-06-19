import './globals.css'
import './home-new.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ResuVanta — ATS CV Optimization & Resume Builder',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  description: 'Optimize your CV, match job descriptions, build ATS-friendly resumes, and improve your LinkedIn profile. Get hired faster with ResuVanta.',
  keywords: 'CV optimization, resume builder, ATS resume, LinkedIn optimization, job application, CV builder, resume optimization, ATS friendly CV',
  authors: [{ name: 'ResuVanta' }],
  creator: 'ResuVanta',
  publisher: 'ResuVanta',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.resuvanta.com',
    siteName: 'ResuVanta',
    title: 'ResuVanta — ATS CV Optimization & Resume Builder',
    description: 'Optimize your CV, match job descriptions, build ATS-friendly resumes, and improve your LinkedIn profile.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResuVanta — ATS CV Optimization & Resume Builder',
    description: 'Optimize your CV and get hired faster.',
  },
  alternates: {
    canonical: 'https://www.resuvanta.com',
  },
  verification: {
    google: 'ARcGreaDnXKVf1mHDStp4ajZjkNMGpnAYTjBjRjxfhQ',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <Script async src="https://www.googletagmanager.com/gtag/js?id=AW-18251745992" strategy="afterInteractive" />
      <Script id="google-ads-tag" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'AW-18251745992');
      `}</Script>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
