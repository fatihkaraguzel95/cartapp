'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false) // token doğrulandı mı?
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const supabase = getSupabase()

    const init = async () => {
      // 1) URL hash'inden token al (eski implicit flow): #access_token=...&type=recovery
      const hash = window.location.hash.substring(1)
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const hashType = hashParams.get('type')

      if (hashType === 'recovery' && accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        if (!error) { setReady(true); return }
      }

      // 2) Query param'dan token al (yeni PKCE / OTP flow): ?token_hash=...&type=recovery
      const tokenHash = searchParams.get('token_hash')
      const type = searchParams.get('type')

      if (tokenHash && type === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
        if (!error) { setReady(true); return }
      }

      // 3) Zaten giriş yapılmış session var mı?
      const { data: { session } } = await supabase.auth.getSession()
      if (session) { setReady(true); return }

      // Token yok veya geçersiz
      setError('Geçersiz veya süresi dolmuş bağlantı. Lütfen tekrar "Şifremi Unuttum" isteği gönderin.')
    }

    init()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Şifreler eşleşmiyor'); return }
    if (password.length < 6) { setError('Şifre en az 6 karakter olmalı'); return }

    setLoading(true)
    setError('')
    const supabase = getSupabase()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('Şifre güncellenemedi: ' + error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔑</div>
          <h1 className="text-2xl font-bold text-white">Yeni Şifre Belirle</h1>
        </div>

        {success ? (
          <div className="bg-green-950 border border-green-700 text-green-300 rounded-2xl px-5 py-4 text-center">
            ✓ Şifre güncellendi! Yönlendiriliyorsunuz...
          </div>
        ) : !ready ? (
          <div className="text-center">
            {error ? (
              <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
            ) : (
              <div className="text-slate-400">Doğrulanıyor...</div>
            )}
            <button onClick={() => router.push('/')} className="mt-4 text-slate-500 text-sm underline">
              Giriş sayfasına dön
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="password"
              placeholder="Yeni şifre (en az 6 karakter)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              className="w-full bg-slate-800 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
            />
            <input
              type="password"
              placeholder="Yeni şifre tekrar"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full bg-slate-800 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
            />
            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-2xl py-4 transition-all active:scale-95"
            >
              {loading ? '...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Yükleniyor...</div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
