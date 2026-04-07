import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

function checkAdminAuth(req: Request) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

// DELETE /api/admin/delete-user — body: { userId }
export async function DELETE(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId gerekli' }, { status: 400 })

  const admin = getAdminSupabase()
  const { error } = await admin.auth.admin.deleteUser(userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
