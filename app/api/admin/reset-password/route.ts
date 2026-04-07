import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

function checkAdminAuth(req: Request) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

// POST /api/admin/reset-password — body: { userId, newPassword }
export async function POST(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { userId, newPassword } = await req.json()
  if (!userId || !newPassword) return NextResponse.json({ error: 'Eksik parametre' }, { status: 400 })
  if (newPassword.length < 6) return NextResponse.json({ error: 'Şifre en az 6 karakter olmalı' }, { status: 400 })

  const admin = getAdminSupabase()
  const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
