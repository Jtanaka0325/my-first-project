import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MenuVoice（メニューボイス）',
  description: '飲食店総合注文・環境フィードバックシステム',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MenuVoice（メニューボイス）',
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
            caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
          }
        ` }} />
      </head>
      <body className="min-h-screen">
        {children}
      </body>
    </html>
  )
}
