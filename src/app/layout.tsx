import type { Metadata } from 'next'
import { Geist, Noto_Sans_Khmer } from 'next/font/google'
import { ToastProvider } from '@/components/providers/ToastProvider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
})

const notoKhmer = Noto_Sans_Khmer({
  variable: '--font-khmer',
  subsets: ['khmer'],
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'សន្សំ - សមាគមន៏សន្សំ និង កម្ជី',
  description: 'វិបផតថលសមាជិកសន្សំសម្រាប់គ្រប់គ្រងការសន្សំ និង កម្ជី',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="km" className={`${geistSans.variable} ${notoKhmer.variable} h-full antialiased`}>
      <body className="min-h-full bg-background text-foreground">
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
