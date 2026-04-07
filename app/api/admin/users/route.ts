import { NextResponse } from 'next/server'
import { getAdminSupabase } from '@/lib/supabase-admin'

function checkAdminAuth(req: Request) {
  return req.headers.get('x-admin-password') === process.env.ADMIN_PASSWORD
}

// GET /api/admin/users — tüm kullanıcıları listele
export async function GET(req: Request) {
  if (!checkAdminAuth(req)) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const admin = getAdminSupabase()
  const { data, error } = await admin.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    users: data.users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }))
  })
}
