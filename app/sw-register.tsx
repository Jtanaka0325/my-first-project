'use client'

import { useEffect } from 'react'

export default function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // 古いService Workerとキャッシュを全てクリアしてから再登録
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister())
    })
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key))
    })

    navigator.serviceWorker.register('/sw.js').catch(console.error)
  }, [])
  return null
}
