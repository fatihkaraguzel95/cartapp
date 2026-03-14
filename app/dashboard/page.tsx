'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { ShoppingList } from '@/types'

export default function DashboardPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [lists, setLists] = useState<ShoppingList[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [listName, setListName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = getSupabase()
      // getSession() reads local cache — no network, works offline/background
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      const user = session.user
      setUser(user)
      await loadLists(user.id)
      setLoading(false)
    }
    init()
  }, [router])

  const loadLists = async (userId: string) => {
    const supabase = getSupabase()
    const { data } = await supabase
      .from('shopping_lists')
      .select('*, list_members!inner(user_id)')
      .eq('list_members.user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setLists(data)
  }

  const createList = async () => {
    if (!listName.trim() || !user) return
    setError('')
    const supabase = getSupabase()
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: list, error: listError } = await supabase
      .from('shopping_lists')
      .insert({ name: listName.trim(), join_code: code, owner_id: user.id })
      .select().single()

    if (listError || !list) { setError('Liste oluşturulamadı.'); return }

    await supabase.from('list_members').insert({ list_id: list.id, user_id: user.id })
    setListName('')
    setShowCreate(false)
    router.push(`/list/${list.id}`)
  }

  const joinList = async () => {
    if (!joinCode.trim() || !user) return
    setError('')
    const supabase = getSupabase()

    const { data: list, error } = await supabase
      .from('shopping_lists')
      .select()
      .eq('join_code', joinCode.trim().toUpperCase())
      .single()

    if (error || !list) { setError('Liste kodu bulunamadı'); return }

    const { error: joinError } = await supabase
      .from('list_members')
      .insert({ list_id: list.id, user_id: user.id })

    if (joinError && joinError.code !== '23505') { setError('Listeye katılınamadı'); return }

    setJoinCode('')
    setShowJoin(false)
    router.push(`/list/${list.id}`)
  }

  const changePassword = async () => {
    setPwError('')
    if (newPassword !== newPasswordConfirm) { setPwError('Yeni şifreler eşleşmiyor'); return }
    if (newPassword.length < 6) { setPwError('Yeni şifre en az 6 karakter olmalı'); return }
    if (!user?.email) return

    setPwLoading(true)
    const supabase = getSupabase()

    // Verify current password
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })

    if (loginError) {
      setPwError('Mevcut şifre yanlış')
      setPwLoading(false)
      return
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setPwError('Şifre güncellenemedi: ' + updateError.message)
    } else {
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

  const deleteList = async (listId: string) => {
    const supabase = getSupabase()
    await supabase.from('shopping_lists').delete().eq('id', listId)
    setLists(prev => prev.filter(l => l.id !== listId))
    setConfirmDelete(null)
  }

  const signOut = async () => {
    const supabase = getSupabase()
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="font-bold text-lg">🛒 Listelerim</h1>
          <p className="text-slate-500 text-xs mt-0.5 truncate max-w-48">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowChangePassword(!showChangePassword); setError(''); setPwError(''); setPwSuccess(false) }}
            className="text-slate-400 text-sm bg-slate-800 px-3 py-2 rounded-xl active:scale-95 transition-all"
            title="Şifre değiştir"
          >
            🔑
          </button>
          <button
            onClick={signOut}
            className="text-slate-400 text-sm bg-slate-800 px-4 py-2 rounded-xl active:scale-95 transition-all"
          >
            Çıkış
          </button>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">

        {/* Password change panel */}
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

        {/* Action buttons */}
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

        {/* Create Form */}
        {showCreate && (
          <div className="bg-slate-800 rounded-2xl p-4 mb-4">
            <h3 className="font-semibold mb-3 text-slate-200">Yeni Liste Oluştur</h3>
            <input
              type="text"
              placeholder="Liste adı (örn: Haftalık Market)"
              value={listName}
              onChange={(e) => setListName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createList()}
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500 mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={createList} className="flex-1 bg-green-600 py-3 rounded-xl text-sm font-bold active:scale-95">Oluştur</button>
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-slate-700 py-3 rounded-xl text-sm active:scale-95">İptal</button>
            </div>
          </div>
        )}

        {/* Join Form */}
        {showJoin && (
          <div className="bg-slate-800 rounded-2xl p-4 mb-4">
            <h3 className="font-semibold mb-3 text-slate-200">Listeye Katıl</h3>
            <input
              type="text"
              placeholder="6 haneli kod (örn: ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && joinList()}
              className="w-full bg-slate-700 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500 mb-3 tracking-widest font-mono text-center text-lg"
              autoFocus
              maxLength={6}
            />
            <div className="flex gap-2">
              <button onClick={joinList} className="flex-1 bg-green-600 py-3 rounded-xl text-sm font-bold active:scale-95">Katıl</button>
              <button onClick={() => setShowJoin(false)} className="flex-1 bg-slate-700 py-3 rounded-xl text-sm active:scale-95">İptal</button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        {/* Lists */}
        {lists.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-5xl mb-4">🛒</div>
            <p className="font-medium">Henüz listeniz yok</p>
            <p className="text-sm mt-1">Liste oluşturun veya bir koda katılın</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Listeler ({lists.length})</h2>
            {lists.map(list => (
              <div key={list.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
                {confirmDelete === list.id ? (
                  /* Silme onayı */
                  <div className="p-4 flex items-center justify-between gap-3">
                    <p className="text-sm text-red-300 font-medium">"{list.name}" silinsin mi?</p>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => deleteList(list.id)}
                        className="bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95"
                      >
                        Sil
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl active:scale-95"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <button
                      onClick={() => router.push(`/list/${list.id}`)}
                      className="flex-1 p-4 text-left active:bg-slate-700 transition-all"
                    >
                      <div className="font-semibold text-white">{list.name}</div>
                      <div className="text-slate-500 text-xs mt-1 font-mono">KOD: {list.join_code}</div>
                    </button>
                    {list.owner_id === user?.id && (
                      <button
                        onClick={() => setConfirmDelete(list.id)}
                        className="px-4 py-4 text-slate-600 hover:text-red-400 transition-colors active:scale-95 text-lg flex-shrink-0"
                      >
                        🗑️
                      </button>
                    )}
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
