// ============================================================
// lib/supabase.ts — Veritabanı Bağlantısı
// ============================================================
// Bu dosya, uygulamanın Supabase veritabanıyla (backend) konuşmasını sağlar.
// Supabase; kullanıcı girişi, verilerin saklanması ve canlı güncellemeler için
// kullanılan bir "Backend as a Service" platformudur.
// ============================================================

import { createClient } from '@supabase/supabase-js'

// NOT: createClient (supabase-js) oturum bilgisini localStorage'da saklar.
// Bu sayede Android PWA modunda uygulama kapatılsa bile oturum kaybolmaz.
// Alternatif olan createBrowserClient (ssr paketi) cookie kullanır ve
// Android standalone modunda oturum kapanınca silinir — bu yüzden tercih edilmedi.

// "client" değişkeni: Supabase bağlantısını bir kez oluşturup tekrar tekrar
// kullanmak için hafızada tutuyoruz. Başlangıçta boş (null).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: ReturnType<typeof createClient<any>> | null = null

// getSupabase() — Supabase istemcisini döndüren fonksiyon
// Her çağrıldığında yeni bir bağlantı açmak yerine, var olanı geri verir.
// Bu tasarım "Singleton Pattern" olarak bilinir — tek bir örnek, her yerde paylaşılır.
export function getSupabase() {
  if (!client) {
    // Eğer daha önce bağlantı oluşturulmadıysa, şimdi oluştur.
    // NEXT_PUBLIC_SUPABASE_URL: Supabase sunucusunun adresi (örn: http://178.104.56.53:8000)
    // NEXT_PUBLIC_SUPABASE_ANON_KEY: Herkese açık API anahtarı (şifre değil, genel erişim için)
    // Bu değerler .env.local dosyasından okunur, kodun içine yazılmaz (güvenlik).
    client = createClient<any>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,       // Oturumu tarayıcı kapansa bile hatırla
          autoRefreshToken: true,     // Oturum süresi dolunca otomatik yenile
          detectSessionInUrl: false,  // URL'deki token'ları işleme (PWA'da sorun çıkarır)
          storageKey: 'cartapp-auth', // localStorage'da hangi isimle saklansın
        },
      }
    )
  }
  // Mevcut bağlantıyı döndür
  return client
}
