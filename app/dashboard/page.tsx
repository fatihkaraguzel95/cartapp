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
  const [listName, setListName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const supabase = getSupabase()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
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
      .select()
      .single()

    if (listError || !list) {
      setError('Liste oluşturulamadı. Tekrar deneyin.')
      return
    }

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

    if (error || !list) {
      setError('Liste kodu bulunamadı')
      return
    }

    const { error: joinError } = await supabase
      .from('list_members')
      .insert({ list_id: list.id, user_id: user.id })

    if (joinError && joinError.code !== '23505') {
      setError('Listeye katılınamadı')
      return
    }

    setJoinCode('')
    setShowJoin(false)
    router.push(`/list/${list.id}`)
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
          <h1 className="font-bold text-lg flex items-center gap-2">
            🛒 Listelerim
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 truncate max-w-48">{user?.email}</p>
        </div>
        <button
          onClick={signOut}
          className="text-slate-400 text-sm bg-slate-800 px-4 py-2 rounded-xl active:scale-95 transition-all"
        >
          Çıkış
        </button>
      </div>

      <div className="p-4 max-w-lg mx-auto">
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
              <button onClick={createList} className="flex-1 bg-green-600 py-3 rounded-xl text-sm font-bold active:scale-95">
                Oluştur
              </button>
              <button onClick={() => setShowCreate(false)} className="flex-1 bg-slate-700 py-3 rounded-xl text-sm active:scale-95">
                İptal
              </button>
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
              <button onClick={joinList} className="flex-1 bg-green-600 py-3 rounded-xl text-sm font-bold active:scale-95">
                Katıl
              </button>
              <button onClick={() => setShowJoin(false)} className="flex-1 bg-slate-700 py-3 rounded-xl text-sm active:scale-95">
                İptal
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">
            {error}
          </div>
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
              <button
                key={list.id}
                onClick={() => router.push(`/list/${list.id}`)}
                className="w-full bg-slate-800 hover:bg-slate-750 rounded-2xl p-4 text-left flex items-center justify-between active:scale-95 transition-all border border-slate-700"
              >
                <div>
                  <div className="font-semibold text-white">{list.name}</div>
                  <div className="text-slate-500 text-xs mt-1 font-mono">KOD: {list.join_code}</div>
                </div>
                <span className="text-slate-500 text-xl">›</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
