'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      // Aktif oturum varsa direkt dashboard'a gönder
      const supabase = getSupabase()
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.replace('/dashboard')
        return
      }

      // Kayıtlı bilgileri yükle
      const savedEmail = localStorage.getItem('cartapp-remember-email')
      const savedPassword = localStorage.getItem('cartapp-remember-password')
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
      }
      if (savedPassword) {
        setPassword(savedPassword)
      }
      setLoading(false)
    }
    init()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')
    const supabase = getSupabase()

    if (tab === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('E-posta veya şifre hatalı')
        setLoading(false)
      } else {
        if (rememberMe) {
          localStorage.setItem('cartapp-remember-email', email)
          localStorage.setItem('cartapp-remember-password', password)
        } else {
          localStorage.removeItem('cartapp-remember-email')
          localStorage.removeItem('cartapp-remember-password')
        }
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message === 'User already registered' ? 'Bu e-posta zaten kayıtlı' : error.message)
        setLoading(false)
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (!loginError) {
          router.push('/dashboard')
          router.refresh()
        } else {
          setInfo('Kayıt başarılı! Şimdi giriş yapabilirsiniz.')
          setTab('login')
          setLoading(false)
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold text-white">Alışveriş</h1>
          <h2 className="text-3xl font-bold text-green-400">Listesi</h2>
          <p className="text-slate-500 text-sm mt-2">Gemeinsame Einkaufsliste</p>
        </div>

        <div className="flex bg-slate-800 rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setTab('login'); setError(''); setInfo('') }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'login' ? 'bg-green-600 text-white' : 'text-slate-400'}`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); setInfo('') }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'register' ? 'bg-green-600 text-white' : 'text-slate-400'}`}
          >
            Kayıt Ol
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="E-posta adresi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full bg-slate-800 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
          />
          <input
            type="password"
            placeholder="Şifre (en az 6 karakter)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            className="w-full bg-slate-800 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
          />

          {tab === 'login' && (
            <label className="flex items-center gap-3 px-1 cursor-pointer select-none">
              <div
                onClick={() => setRememberMe(!rememberMe)}
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${rememberMe ? 'bg-green-600' : 'bg-slate-700 border border-slate-600'}`}
              >
                {rememberMe && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span onClick={() => setRememberMe(!rememberMe)} className="text-slate-400 text-sm">Beni hatırla (e-posta ve şifre)</span>
            </label>
          )}

          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}
          {info && (
            <div className="bg-green-950 border border-green-800 text-green-300 text-sm rounded-xl px-4 py-3">
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-2xl py-4 text-base transition-all active:scale-95"
          >
            {loading ? '...' : tab === 'login' ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>
      </div>
    </div>
  )
}
