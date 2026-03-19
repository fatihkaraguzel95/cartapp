// ============================================================
// app/dashboard/page.tsx — Ana Panel (Dashboard)
// ============================================================
// Giriş yapan kullanıcının ilk gördüğü sayfa.
// Kullanıcının tüm alışveriş listelerini gösterir.
// Yeni liste oluşturma, koda katılma ve şifre değiştirme işlemleri burada yapılır.
// ============================================================

'use client' // Tarayıcıda çalışır (state, event listener kullandığı için)

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { ShoppingList } from '@/types'

export default function DashboardPage() {
  // --- STATE (Durum Değişkenleri) ---

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null) // Giriş yapmış kullanıcı bilgisi
  const [lists, setLists] = useState<ShoppingList[]>([])  // Kullanıcının tüm listeleri
  const [showCreate, setShowCreate] = useState(false)      // "Liste Oluştur" formu açık mı?
  const [showJoin, setShowJoin] = useState(false)          // "Koda Katıl" formu açık mı?
  const [showChangePassword, setShowChangePassword] = useState(false) // Şifre değiştirme paneli açık mı?
  const [listName, setListName] = useState('')             // Yeni liste adı
  const [joinCode, setJoinCode] = useState('')             // Katılmak için girilen kod
  const [loading, setLoading] = useState(true)            // Sayfa yükleniyor mu?
  const [error, setError] = useState('')                   // Hata mesajı

  // Şifre değiştirme için ayrı state'ler
  const [currentPassword, setCurrentPassword] = useState('')      // Mevcut şifre
  const [newPassword, setNewPassword] = useState('')              // Yeni şifre
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('') // Yeni şifre tekrarı (doğrulama)
  const [pwLoading, setPwLoading] = useState(false)               // Şifre değişiyor mu?
  const [pwError, setPwError] = useState('')                      // Şifre değiştirme hatası
  const [pwSuccess, setPwSuccess] = useState(false)               // Şifre başarıyla değişti mi?
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null) // Silinecek listenin ID'si (onay için)

  const router = useRouter()

  // --- SAYFA YÜKLENDİĞİNDE ÇALIŞIR ---
  useEffect(() => {
    const init = async () => {
      const supabase = getSupabase()

      // Oturum kontrolü: giriş yapılmamışsa ana sayfaya gönder
      // getSession() önbelleği okur — ağ isteği yapmaz, hızlıdır
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }

      const user = session.user
      setUser(user) // Kullanıcı bilgisini state'e kaydet

      await loadLists(user.id) // Kullanıcının listelerini yükle
      setLoading(false)
    }
    init()
  }, [router])

  // --- LİSTELERİ YÜKLE ---
  // Kullanıcının üye olduğu tüm alışveriş listelerini veritabanından çeker.
  const loadLists = async (userId: string) => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('shopping_lists')
      // list_members tablosuyla birleştir: sadece bu kullanıcının üye olduğu listeleri getir
      .select('*, list_members!inner(user_id)')
      .eq('list_members.user_id', userId)
      .order('created_at', { ascending: false }) // En yeni listeler önce gösterilsin
    if (data) setLists(data)
  }

  // --- YENİ LİSTE OLUŞTUR ---
  const createList = async () => {
    if (!listName.trim() || !user) return // Boş isimle liste oluşturulamaz
    setError('')
    const supabase = getSupabase()

    // Rastgele 6 karakterli katılma kodu oluştur (örn: "A3BX9K")
    // Math.random() → 0-1 arası sayı → .toString(36) → harf+rakam → büyük harf
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Listeyi veritabanına ekle
    const { data: list, error: listError } = await supabase
      .from('shopping_lists')
      .insert({ name: listName.trim(), join_code: code, owner_id: user.id })
      .select().single() // Eklenen kaydı geri al

    if (listError || !list) { setError('Liste oluşturulamadı.'); return }

    // Listeyi oluşturan kişiyi otomatik olarak üye yap
    await supabase.from('list_members').insert({ list_id: list.id, user_id: user.id })

    setListName('')
    setShowCreate(false)
    router.push(`/list/${list.id}`) // Yeni listeye git
  }

  // --- KODA KATIL ---
  // Başkasının paylaştığı 6 haneli kod ile bir listeye katıl.
  const joinList = async () => {
    if (!joinCode.trim() || !user) return
    setError('')
    const supabase = getSupabase()

    // Kodu veritabanında ara
    const { data: list, error } = await supabase
      .from('shopping_lists')
      .select()
      .eq('join_code', joinCode.trim().toUpperCase()) // Büyük-küçük harf fark etmemeli
      .single()

    if (error || !list) { setError('Liste kodu bulunamadı'); return }

    // Kullanıcıyı listeye üye olarak ekle
    const { error: joinError } = await supabase
      .from('list_members')
      .insert({ list_id: list.id, user_id: user.id })

    // Hata kodu 23505 = "zaten üye" (UNIQUE constraint ihlali) — bu durumda sorun yok, devam et
    if (joinError && joinError.code !== '23505') { setError('Listeye katılınamadı'); return }

    setJoinCode('')
    setShowJoin(false)
    router.push(`/list/${list.id}`) // Listeye git
  }

  // --- ŞİFRE DEĞİŞTİR ---
  const changePassword = async () => {
    setPwError('')

    // Validasyonlar (giriş doğrulamaları)
    if (newPassword !== newPasswordConfirm) { setPwError('Yeni şifreler eşleşmiyor'); return }
    if (newPassword.length < 6) { setPwError('Yeni şifre en az 6 karakter olmalı'); return }
    if (!user?.email) return

    setPwLoading(true)
    const supabase = getSupabase()

    // Önce mevcut şifreyi doğrula (yeniden giriş yaparak)
    // Bu adım güvenlik için gereklidir — başkası bilgisayarı açık bıraksa şifre değiştiremez
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (loginError) {
      setPwError('Mevcut şifre yanlış')
      setPwLoading(false)
      return
    }

    // Şifreyi güncelle
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setPwError('Şifre güncellenemedi: ' + updateError.message)
    } else {
      // Başarılı: formu sıfırla ve 2 saniye sonra kapat
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setNewPasswordConfirm('')
      setTimeout(() => {
        setPwSuccess(false)
        setShowChangePassword(false)
      }, 2000)
    }
    setPwLoading(false)
  }

  // --- LİSTEYİ SİL ---
  // Sadece listenin sahibi (owner) silebilir — RLS politikası bunu veritabanında da zorlar.
  const deleteList = async (listId: string) => {
    const supabase = getSupabase()
    await supabase.from('shopping_lists').delete().eq('id', listId)
    // Silinen listeyi ekrandan da kaldır (veritabanını yeniden sorgulamadan)
    setLists(prev => prev.filter(l => l.id !== listId))
    setConfirmDelete(null) // Onay modunu kapat
  }

  // --- ÇIKIŞ YAP ---
  const signOut = async () => {
    const supabase = getSupabase()
    await supabase.auth.signOut() // Oturumu sonlandır
    router.push('/') // Giriş sayfasına yönlendir
  }

  // --- YÜKLENİYOR EKRANI ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Yükleniyor...</div>
      </div>
    )
  }

  // --- ANA EKRAN ---
  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Üst bar (header) — ekranda sabit kalır, kaydırmada kaybolmaz */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-lg">🛒 Listelerim</h1>
          <p className="text-slate-500 text-xs mt-0.5 truncate max-w-48">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Şifre değiştir butonu */}
          <button
            onClick={() => { setShowChangePassword(!showChangePassword); setError(''); setPwError(''); setPwSuccess(false) }}
            className="text-slate-400 text-sm bg-slate-800 px-3 py-2 rounded-xl active:scale-95 transition-all"
            title="Şifre değiştir"
          >
            🔑
          </button>
          {/* Çıkış butonu */}
          <button
            onClick={signOut}
            className="text-slate-400 text-sm bg-slate-800 px-4 py-2 rounded-xl active:scale-95 transition-all"
          >
            Çıkış
          </button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">

        {/* Şifre değiştirme paneli — butona basılınca açılır/kapanır */}
        {showChangePassword && (
          <div className="bg-slate-800 rounded-2xl p-4 mb-5 border border-slate-700">
            <h3 className="font-semibold mb-3 flex items-center gap-2">🔑 Şifre Değiştir</h3>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Mevcut şifre"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                className="w-full bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
              />
              <input
                type="password"
                placeholder="Yeni şifre (en az 6 karakter)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
              />
              <input
                type="password"
                placeholder="Yeni şifre tekrar"
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                autoComplete="new-password"
                className="w-full bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
              />
              {/* Hata ve başarı mesajları */}
              {pwError && (
                <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-3 py-2">{pwError}</div>
              )}
              {pwSuccess && (
                <div className="bg-green-950 border border-green-700 text-green-300 text-sm rounded-xl px-3 py-2">✓ Şifre başarıyla değiştirildi!</div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={changePassword}
                  disabled={pwLoading || !currentPassword || !newPassword || !newPasswordConfirm}
                  className="flex-1 bg-green-600 disabled:opacity-50 py-3 rounded-xl text-sm font-bold active:scale-95"
                >
                  {pwLoading ? '...' : 'Değiştir'}
                </button>
                <button
                  onClick={() => { setShowChangePassword(false); setPwError(''); setCurrentPassword(''); setNewPassword(''); setNewPasswordConfirm('') }}
                  className="flex-1 bg-slate-700 py-3 rounded-xl text-sm active:scale-95"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ana eylem butonları: Liste Oluştur / Koda Katıl */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => { setShowCreate(!showCreate); setShowJoin(false); setError('') }}
            className="bg-green-700 hover:bg-green-600 text-white font-bold rounded-2xl py-5 text-sm active:scale-95 transition-all"
          >
            + Liste Oluştur
          </button>
          <button
            onClick={() => { setShowJoin(!showJoin); setShowCreate(false); setError('') }}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-2xl py-5 text-sm active:scale-95 transition-all"
          >
            # Koda Katıl
          </button>
        </div>

        {/* Liste oluşturma formu — "Liste Oluştur" butonuna basılınca açılır */}
        {showCreate && (
          <div className="bg-slate-800 rounded-2xl p-4 mb-4">
            <h3 className="font-semibold mb-3 text-slate-200">Yeni Liste Oluştur</h3>
            <input
              type="text"
              placeholder="Liste adı (örn: Haftalık Market)"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createList()} // Enter'a basınca da oluştur
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500 mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={createList} className="flex-1 bg-green-600 py-3 rounded-xl text-sm font-bold active:scale-95">Oluştur</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-slate-700 py-3 rounded-xl text-sm active:scale-95">İptal</button>
            </div>
          </div>
        )}

        {/* Koda katılma formu — "Koda Katıl" butonuna basılınca açılır */}
        {showJoin && (
          <div className="bg-slate-800 rounded-2xl p-4 mb-4">
            <h3 className="font-semibold mb-3 text-slate-200">Listeye Katıl</h3>
            <input
              type="text"
              placeholder="6 haneli kod (örn: ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())} // Otomatik büyük harfe çevir
              onKeyDown={(e) => e.key === 'Enter' && joinList()}
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500 mb-3 tracking-widest font-mono text-center text-lg"
              autoFocus
              maxLength={6} // En fazla 6 karakter girilebilir
            />
            <div className="flex gap-2">
              <button onClick={joinList} className="flex-1 bg-green-600 py-3 rounded-xl text-sm font-bold active:scale-95">Katıl</button>
              <button onClick={() => setShowJoin(false)} className="flex-1 bg-slate-700 py-3 rounded-xl text-sm active:scale-95">İptal</button>
            </div>
          </div>
        )}

        {/* Genel hata mesajı */}
        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        {/* Listeler */}
        {lists.length === 0 ? (
          // Hiç liste yoksa boş durum mesajı göster
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-4">🛒</div>
            <p className="font-medium">Henüz listeniz yok</p>
            <p className="text-sm mt-1">Liste oluşturun veya bir koda katılın</p>
          </div>
        ) : (
          // Listeler varsa sırayla göster
          <div className="space-y-3">
            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Listeler ({lists.length})</h2>
            {lists.map(list => (
              <div key={list.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">

                {/* Silme onayı gösteriliyor mu? */}
                {confirmDelete === list.id ? (
                  <div className="p-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-red-300 font-medium">&quot;{list.name}&quot; silinsin mi?</p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => deleteList(list.id)}
                        className="bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95"
                      >
                        Sil
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)} // Onayı iptal et
                        className="bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl active:scale-95"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    {/* Liste adı ve kodu — tıklanınca listeye git */}
                    <button
                      onClick={() => router.push(`/list/${list.id}`)}
                      className="flex-1 p-4 text-left active:bg-slate-700 transition-all"
                    >
                      <div className="font-semibold text-white">{list.name}</div>
                      <div className="text-slate-500 text-xs mt-1 font-mono">KOD: {list.join_code}</div>
                    </button>

                    {/* Silme butonu — sadece listenin sahibine göster */}
                    {list.owner_id === user?.id && (
                      <button
                        onClick={() => setConfirmDelete(list.id)} // Silme onayını aç
                        className="px-4 py-4 text-slate-600 hover:text-red-400 transition-colors active:scale-95 text-lg flex-shrink-0"
                      >
                        🗑️
                      </button>
                    )}

                    {/* Üye ama sahip değilse sağ ok ikonu göster */}
                    {list.owner_id !== user?.id && (
                      <span className="px-4 text-slate-600 text-xl">›</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
