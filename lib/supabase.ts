import { createClient } from '@supabase/supabase-js'

// createClient (supabase-js) uses localStorage — persists on Android PWA
// createBrowserClient (ssr) uses cookies — gets cleared on Android standalone mode

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: ReturnType<typeof createClient<any>> | null = null

export function getSupabase() {
  if (!client) {
    client = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: 'cartapp-auth',
        },
      }
    )
  }
  return client
}
