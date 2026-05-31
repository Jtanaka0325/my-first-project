import type { Metadata, Viewport } from 'next'
import './globals.css'
import SwRegister from './sw-register'

export const metadata: Metadata = {
  title: 'MenuVoice',
  description: '飲食店総合注文・環境フィードバックシステム',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MenuVoice',
  },
}

export const viewport: Viewport = {
  themeColor: '#f97316',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen">
        <SwRegister />
        {children}
      </body>
    </html>
  )
}
