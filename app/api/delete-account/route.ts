import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

// DELETE /api/delete-account
// Kullanıcının kendi hesabını silmesi için. Authorization header'da access_token gerekir.
export async function DELETE(req: Request) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.split(' ')[1]
  if (!token) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const admin = getAdminSupabase()

  // Token'ı doğrula — hangi kullanıcıya ait olduğunu bul
  const { data: { user }, error: userError } = await admin.auth.getUser(token)
  if (userError || !user) return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })

  // Kullanıcıyı sil (auth.users tablosundan — cascade ile ilgili kayıtlar da silinir)
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
