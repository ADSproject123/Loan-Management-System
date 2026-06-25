import type { Metadata } from 'next'
import { Geist, Noto_Sans_Khmer } from 'next/font/google'
import Script from 'next/script'
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
  title: 'សមាគមន៏សន្សំ និង កម្ជី',
  description: 'គ្រប់គ្រងការសន្សំ និង កម្ជី',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="km" className={`${geistSans.variable} ${notoKhmer.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        {/* Telegram Mini App SDK — initialises window.Telegram.WebApp before React hydration */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
