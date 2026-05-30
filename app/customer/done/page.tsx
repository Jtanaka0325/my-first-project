'use client'

import { useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function DonePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tableNumber = searchParams.get('table') ?? '1'

  useEffect(() => {
    const t = setTimeout(() => router.push(`/customer?table=${tableNumber}`), 4000)
    return () => clearTimeout(t)
  }, [tableNumber, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-sm text-center">
        <div className="text-7xl mb-6">🎉</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">ご注文ありがとうございました！</h1>
        <p className="text-gray-500 text-sm">しばらくお待ちください。<br />まもなくメニュー画面に戻ります。</p>
      </div>
    </div>
  )
}

export default function DoneWrapper() {
  return (
    <Suspense fallback={null}>
      <DonePage />
    </Suspense>
  )
}
