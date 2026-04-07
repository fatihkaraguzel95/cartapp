'use client'

import { useState } from 'react'

type User = {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
}

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [adminPwd, setAdminPwd] = useState('') // doğrulanmış şifre (bellekte tutar)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Şifre sıfırlama modal state'i
  const [resetUser, setResetUser] = useState<User | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [resetMsg, setResetMsg] = useState('')

  // Silme onayı
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  const adminHeaders = { 'Content-Type': 'application/json', 'x-admin-password': adminPwd }

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/users', {
      headers: { 'x-admin-password': password }
    })

    if (!res.ok) {
      setError('Şifre yanlış')
      setLoading(false)
      return
    }

    const data = await res.json()
    setAdminPwd(password)
    setUsers(data.users)
    setLoading(false)
  }

  const refreshUsers = async () => {
    const res = await fetch('/api/admin/users', { headers: { 'x-admin-password': adminPwd } })
    const data = await res.json()
    setUsers(data.users)
  }

  const resetPassword = async () => {
    if (!resetUser || !newPassword) return
    setResetLoading(true)
    setResetMsg('')

    const res = await fetch('/api/admin/reset-password', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ userId: resetUser.id, newPassword }),
    })

    const data = await res.json()
    if (data.success) {
      setResetMsg('✓ Şifre güncellendi')
      setNewPassword('')
      setTimeout(() => { setResetUser(null); setResetMsg('') }, 1500)
    } else {
      setResetMsg('Hata: ' + data.error)
    }
    setResetLoading(false)
  }

  const deleteUser = async (userId: string) => {
    const res = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: adminHeaders,
      body: JSON.stringify({ userId }),
    })

    const data = await res.json()
    if (data.success) {
      setUsers(prev => prev.filter(u => u.id !== userId))
    } else {
      alert('Silinemedi: ' + data.error)
    }
    setDeleteUserId(null)
  }

  // Giriş yapılmamışsa şifre formu göster
  if (!adminPwd) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-xs">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🛡️</div>
            <h1 className="text-xl font-bold text-white">Admin Paneli</h1>
          </div>
          <form onSubmit={login} className="space-y-3">
            <input
              type="password"
              placeholder="Admin şifresi"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full bg-slate-800 text-white rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
            />
            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-3">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 disabled:opacity-50 text-white font-bold rounded-2xl py-4 active:scale-95"
            >
              {loading ? '...' : 'Giriş'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">🛡️ Admin — Kullanıcılar ({users.length})</h1>
          <button
            onClick={() => { setAdminPwd(''); setUsers([]) }}
            className="text-slate-500 text-sm bg-slate-800 px-3 py-2 rounded-xl"
          >
            Çıkış
          </button>
        </div>

        {/* Kullanıcı listesi */}
        <div className="space-y-3">
          {users.map(user => (
            <div key={user.id} className="bg-slate-800 rounded-2xl border border-slate-700">

              {/* Silme onayı */}
              {deleteUserId === user.id ? (
                <div className="p-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-red-300">{user.email} silinsin mi?</p>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="bg-red-700 text-white text-xs font-bold px-3 py-2 rounded-xl active:scale-95"
                    >
                      Sil
                    </button>
                    <button
                      onClick={() => setDeleteUserId(null)}
                      className="bg-slate-700 text-slate-300 text-xs px-3 py-2 rounded-xl active:scale-95"
                    >
                      İptal
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="font-medium text-white truncate">{user.email}</div>
                  <div className="text-slate-500 text-xs mt-0.5">
                    {user.last_sign_in_at
                      ? 'Son giriş: ' + new Date(user.last_sign_in_at).toLocaleString('tr-TR')
                      : 'Hiç giriş yapılmadı'}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => { setResetUser(user); setNewPassword(''); setResetMsg('') }}
                      className="flex-1 bg-slate-700 text-sm py-2 rounded-xl active:scale-95 transition-all"
                    >
                      🔑 Şifre Sıfırla
                    </button>
                    <button
                      onClick={() => setDeleteUserId(user.id)}
                      className="bg-slate-700 text-red-400 text-sm px-4 py-2 rounded-xl active:scale-95 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Şifre sıfırlama modal */}
      {resetUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-2xl p-5 w-full max-w-sm border border-slate-700">
            <h3 className="font-bold mb-1">🔑 Şifre Sıfırla</h3>
            <p className="text-slate-400 text-sm mb-4 truncate">{resetUser.email}</p>
            <input
              type="text"
              placeholder="Yeni şifre (en az 6 karakter)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
              className="w-full bg-slate-700 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500 mb-3"
            />
            {resetMsg && (
              <div className={`text-sm rounded-xl px-3 py-2 mb-3 ${resetMsg.startsWith('✓') ? 'bg-green-950 text-green-300 border border-green-800' : 'bg-red-950 text-red-300 border border-red-800'}`}>
                {resetMsg}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={resetPassword}
                disabled={resetLoading || newPassword.length < 6}
                className="flex-1 bg-green-600 disabled:opacity-50 py-3 rounded-xl text-sm font-bold active:scale-95"
              >
                {resetLoading ? '...' : 'Güncelle'}
              </button>
              <button
                onClick={() => setResetUser(null)}
                className="flex-1 bg-slate-700 py-3 rounded-xl text-sm active:scale-95"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
