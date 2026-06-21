'use client'

import { useEffect } from 'react'

// Service Worker'ı tarayıcıya kaydeden bileşen.
// Layout'a eklenir, herhangi bir UI render etmez.
export default function SwRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
  }, [])
  return null
}
