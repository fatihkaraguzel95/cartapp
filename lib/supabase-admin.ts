import { createClient } from '@supabase/supabase-js'

// Sunucu tarafında çalışır, service_role key kullanır
// Bu client RLS'yi bypass eder — sadece API route'larında kullan
export function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
