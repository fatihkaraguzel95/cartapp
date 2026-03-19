// ============================================================
// proxy.ts — İstek Ara Katmanı (Middleware)
// ============================================================
// Bu dosya Next.js 16'nın "middleware" özelliğini kullanır.
// Normal Next.js'te bu dosya "middleware.ts" olarak adlandırılır,
// ancak Next.js 16'da "proxy.ts" adını alır ve fonksiyon adı "proxy" olur.
//
// Ara katman (middleware) ne yapar?
// Her sayfa isteği sunucuya ulaşmadan ÖNCE bu fonksiyondan geçer.
// Örneğin: kullanıcı giriş yapmadan korumalı sayfalara erişmeye çalışırsa,
// burada yakalayıp giriş sayfasına yönlendirebilirsiniz.
//
// Mevcut durumda: Kimlik doğrulama tamamen istemci tarafında (tarayıcıda)
// yapıldığı için, proxy sadece isteği geçiriyor (yönlendirme yapmıyor).
// ============================================================

import { NextResponse, type NextRequest } from 'next/server'

// proxy() — Her HTTP isteğini karşılayan fonksiyon
// request: Kullanıcının tarayıcısından gelen istek bilgisi
// NextResponse.next(): "Devam et, isteği normal şekilde işle" anlamına gelir
export async function proxy(request: NextRequest) {
  return NextResponse.next({ request })
}

// config.matcher — Bu proxy'nin hangi sayfalarda çalışacağını belirler.
// Aşağıdaki pattern: API rotaları, statik dosyalar ve favicon dışındaki
// her URL için bu proxy'i çalıştır.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
