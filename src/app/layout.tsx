import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import localFont from 'next/font/local'
import Script from 'next/script'
import { ToastProvider } from '@/components/providers/ToastProvider'
import './globals.css'

const notoKhmer = localFont({
  src: [
    { path: '../../public/fonts/NotoSansKhmer-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../../public/fonts/NotoSansKhmer-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-khmer',
  display: 'swap',
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
    <html lang="km" className={`${GeistSans.variable} ${notoKhmer.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full bg-background text-foreground">
        {/* Telegram Mini App SDK — initialises window.Telegram.WebApp before React hydration */}
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
