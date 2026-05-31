'use client'

import { useEffect } from 'react'

export default function SwRegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // 全SWを登録解除し、全キャッシュを削除（古いSWがキャッシュしたJSを確実に消去）
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister())
    })
    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key))
    })
    // SWは再登録しない（キャッシュ問題を根本回避）
  }, [])
  return null
}
