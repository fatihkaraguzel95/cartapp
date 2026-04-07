// ============================================================
// app/page.tsx — Giriş / Kayıt Sayfası (Ana Sayfa)
// ============================================================
// Bu, uygulamanın ilk açıldığında gösterdiği sayfadır (/).
// Kullanıcı giriş yapabilir veya yeni hesap oluşturabilir.
// Eğer kullanıcı zaten giriş yapmışsa, otomatik olarak dashboard'a yönlendirilir.
// ============================================================

'use client' // Bu bileşen tarayıcıda çalışır (sunucuda değil), çünkü state ve event kullanıyor

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'

export default function AuthPage() {
  // --- STATE (Durum Değişkenleri) ---
  // useState ile tanımlanan değişkenler değiştiğinde ekran otomatik yenilenir.

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const router = useRouter()                     // Sayfa yönlendirme için Next.js hook'u

  // --- SAYFA YÜKLENDİĞİNDE ÇALIŞIR ---
  // useEffect: Bileşen ekrana ilk geldiğinde bir kez çalışan kod bloğu.
  useEffect(() => {
    const init = async () => {
      const supabase = getSupabase()

      // Kullanıcı daha önce giriş yapmış mı kontrol et
      // getSession() ağ isteği yapmadan localStorage'dan okur — hızlı ve çevrimdışı çalışır
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Oturum varsa giriş sayfasını gösterme, direkt dashboard'a gönder
        router.replace('/dashboard')
        return
      }

      // "Beni hatırla" özelliği: daha önce kaydedilmiş e-posta ve şifre varsa doldur
      const savedEmail = localStorage.getItem('cartapp-remember-email')
      const savedPassword = localStorage.getItem('cartapp-remember-password')
      if (savedEmail) {
        setEmail(savedEmail)
        setRememberMe(true)
      }
      if (savedPassword) {
        setPassword(savedPassword)
      }

      setLoading(false) // Yükleme bitti, formu göster
    }
    init()
  }, [router]) // [router]: bu effect sadece component ilk yüklendiğinde çalışır

  // --- FORM GÖNDERİLDİĞİNDE ÇALIŞIR ---
  // Kullanıcı "Giriş Yap" veya "Kayıt Ol" butonuna bastığında tetiklenir.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault() // Sayfanın yenilenmesini engelle (tarayıcının varsayılan form davranışı)
    setLoading(true)
    setError('')
    setInfo('')
    const supabase = getSupabase()

    if (tab === 'login') {
      // --- GİRİŞ YAP ---
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // Giriş başarısız: hata mesajını göster
        setError('E-posta veya şifre hatalı')
        setLoading(false)
      } else {
        // Giriş başarılı

        // "Beni hatırla" seçildiyse bilgileri localStorage'a kaydet
        // Seçilmediyse daha önce kaydedilmiş bilgileri sil
        if (rememberMe) {
          localStorage.setItem('cartapp-remember-email', email)
          localStorage.setItem('cartapp-remember-password', password)
        } else {
          localStorage.removeItem('cartapp-remember-email')
          localStorage.removeItem('cartapp-remember-password')
        }

        // Dashboard sayfasına yönlendir
        router.push('/dashboard')
        router.refresh() // Sayfanın yeni oturumu tanıması için yenile
      }
    } else if (tab === 'forgot') {
      // --- ŞİFREMİ UNUTTUM ---
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) {
        setError('İstek gönderilemedi: ' + error.message)
      } else {
        setInfo('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.')
      }
      setLoading(false)
    } else {
      // --- KAYIT OL ---
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        // Kayıt başarısız: anlamlı hata mesajı göster
        setError(error.message === 'User already registered' ? 'Bu e-posta zaten kayıtlı' : error.message)
        setLoading(false)
      } else {
        // Kayıt başarılı — hemen otomatik giriş yapmayı dene
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (!loginError) {
          // Otomatik giriş başarılı, dashboard'a yönlendir
          router.push('/dashboard')
          router.refresh()
        } else {
          // Otomatik giriş olmadı (e-posta onayı gerekiyor olabilir)
          // Kullanıcıyı bilgilendir ve giriş sekmesine geç
          setInfo('Kayıt başarılı! Şimdi giriş yapabilirsiniz.')
          setTab('login')
          setLoading(false)
        }
      }
    }
  }

  // --- YÜKLENİYOR EKRANI ---
  // Sayfa ilk açılırken oturum kontrol edilirken gösterilir
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Yükleniyor...</div>
      </div>
    )
  }

  // --- ANA EKRAN ---
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo ve başlık alanı */}
        <div className="text-center mb-10">
          <div className="text-7xl mb-4">🛒</div>
          <h1 className="text-3xl font-bold text-white">Alışveriş</h1>
          <h2 className="text-3xl font-bold text-green-400">Listesi</h2>
          <p className="text-slate-500 text-sm mt-2">Gemeinsame Einkaufsliste</p>
        </div>

        {/* Sekme seçici */}
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
          <button
            onClick={() => { setTab('forgot'); setError(''); setInfo('') }}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-all ${tab === 'forgot' ? 'bg-slate-600 text-white' : 'text-slate-400'}`}
          >
            Unuttum
          </button>
        </div>

        {/* Giriş/Kayıt formu */}
        <form onSubmit={handleSubmit} className="space-y-3">

          {/* E-posta alanı */}
          <input
            type="email"
            placeholder="E-posta adresi"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // Her harf yazıldığında state'i güncelle
            required
            autoComplete="email"
            className="w-full bg-slate-800 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
          />

          {/* Şifre alanı — "Unuttum" sekmesinde gösterme */}
          {tab !== 'forgot' && (
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
          )}

          {/* "Beni Hatırla" — sadece giriş sekmesinde göster */}
          {tab === 'login' && (
            <label className="flex items-center gap-3 px-1 cursor-pointer select-none">
              {/* Özel checkbox tasarımı */}
              <div
                onClick={() => setRememberMe(!rememberMe)} // Tıklanınca tersine çevir
                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all ${rememberMe ? 'bg-green-600' : 'bg-slate-700 border border-slate-600'}`}
              >
                {/* İşaretliyse tik ikonu göster */}
                {rememberMe && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span onClick={() => setRememberMe(!rememberMe)} className="text-slate-400 text-sm">Beni hatırla (e-posta ve şifre)</span>
            </label>
          )}

          {/* Hata mesajı kutusu — sadece hata varsa göster */}
          {error && (
            <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Bilgi mesajı kutusu — sadece bilgi mesajı varsa göster */}
          {info && (
            <div className="bg-green-950 border border-green-800 text-green-300 text-sm rounded-xl px-4 py-3">
              {info}
            </div>
          )}

          {/* Gönder butonu */}
          <button
            type="submit"
            disabled={loading} // Yüklenirken buton devre dışı
            className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-2xl py-4 text-base transition-all active:scale-95"
          >
            {/* Yükleniyorsa "..." göster, değilse sekmeye göre buton metni */}
            {loading ? '...' : tab === 'login' ? 'Giriş Yap' : tab === 'register' ? 'Kayıt Ol' : 'Bağlantı Gönder'}
          </button>
        </form>
      </div>
    </div>
  )
}
