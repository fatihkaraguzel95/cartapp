'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = getSupabase()

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('E-posta veya şifre hatalı')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message === 'User already registered' ? 'Bu e-posta zaten kayıtlı' : error.message)
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (!loginError) {
          router.push('/dashboard')
          router.refresh()
        } else {
          setError('Kayıt başarılı! Lütfen e-postanızı doğrulayın.')
        }
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold text-white">Alışveriş</h1>
          <h2 className="text-3xl font-bold text-green-400">Listesi</h2>
          <p className="text-slate-500 text-sm mt-2">Gemeinsame Einkaufsliste</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-800 rounded-2xl p-1 mb-6">
          <button
            onClick={() => { setIsLogin(true); setError('') }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              isLogin ? 'bg-green-600 text-white' : 'text-slate-400'
            }`}
          >
            Giriş Yap
          </button>
          <button
            onClick={() => { setIsLogin(false); setError('') }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${
              !isLogin ? 'bg-green-600 text-white' : 'text-slate-400'
            }`}
          >
            Kayıt Ol
          </button>
        </div>

        {/* Form */}
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
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            className="w-full bg-slate-800 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
          />

          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-2xl py-4 text-base transition-all active:scale-95"
          >
            {loading ? '...' : isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>
      </div>
    </div>
  )
}
