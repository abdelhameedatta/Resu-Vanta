import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ResuVanta — CV Optimization & Resume Builder',
  description: 'Optimize your CV with AI, match job descriptions, build ATS-friendly resumes, and improve your LinkedIn profile. Get hired faster with ResuVanta.',
  keywords: 'CV optimization, resume builder, ATS resume, LinkedIn optimization, job application, CV builder, resume optimization, ATS friendly CV',
  authors: [{ name: 'ResuVanta' }],
  creator: 'ResuVanta',
  publisher: 'ResuVanta',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.resuvanta.com', // 🔥 تم التعديل هنا للدومين الجديد
    siteName: 'ResuVanta',
    title: 'ResuVanta — CV Optimization & Resume Builder',
    description: 'Optimize your CV with AI, match job descriptions, build ATS-friendly resumes, and improve your LinkedIn profile.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResuVanta — CV Optimization & Resume Builder',
    description: 'Optimize your CV with AI and get hired faster.',
  },
  alternates: {
    canonical: 'https://www.resuvanta.com',   
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
