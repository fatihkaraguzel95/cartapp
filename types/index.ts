// ============================================================
// types/index.ts — Veri Yapıları (TypeScript Arayüzleri)
// ============================================================
// Bu dosya, uygulamada kullanılan veri tiplerini tanımlar.
// TypeScript'te "interface" (arayüz), bir nesnenin hangi alanlara
// sahip olacağını ve bu alanların ne tür veri içereceğini belirtir.
// Böylece hatalı veri kullanımı derleme aşamasında yakalanır.
// ============================================================

// Ürün — Veritabanındaki "products" tablosunu temsil eder.
// Her market ürününün (elma, süt, şampuan vb.) sahip olduğu bilgiler.
export interface Product {
  id: string           // Benzersiz kimlik (UUID formatında, örn: "a1b2c3d4-...")
  name_tr: string      // Türkçe ürün adı (örn: "Elma")
  name_de: string      // Almanca ürün adı (örn: "Apfel") — Almanya'daki kullanıcılar için
  category: string     // Ürün kategorisi (örn: "meyve", "sebze", "temizlik")
  emoji: string        // Ürünü temsil eden emoji (örn: "🍎")
  search_terms?: string // Arama için ek kelimeler — "?" işareti bu alanın opsiyonel olduğunu gösterir
}

// Alışveriş Listesi — "shopping_lists" tablosunu temsil eder.
// Kullanıcıların oluşturduğu her liste bir ShoppingList nesnesidir.
export interface ShoppingList {
  id: string           // Benzersiz kimlik
  name: string         // Listenin adı (örn: "Haftalık Market")
  join_code: string    // Başkalarının listeye katılmak için kullanacağı 6 haneli kod (örn: "ABC123")
  owner_id: string     // Listeyi oluşturan kullanıcının kimliği
  created_at: string   // Listenin oluşturulma tarihi ve saati
}

// Liste Öğesi — "list_items" tablosunu temsil eder.
// Bir alışveriş listesine eklenmiş her ürün bir ListItem'dır.
export interface ListItem {
  id: string           // Benzersiz kimlik
  list_id: string      // Hangi listeye ait olduğu
  product_id: string   // Hangi ürün olduğu (products tablosuna referans)
  added_by: string     // Ürünü sepete kimin eklediği (kullanıcı kimliği)
  added_at: string     // Ürünün eklendiği tarih ve saat
  quantity: number     // Miktar (örn: 2, 500, 1)
  unit: string         // Birim (örn: "adet", "kg", "ml", "paket")
}

// Liste Üyesi — "list_members" tablosunu temsil eder.
// Bir listeye erişimi olan her kullanıcı bir ListMember kaydıdır.
export interface ListMember {
  id: string           // Benzersiz kimlik
  list_id: string      // Hangi listeye ait
  user_id: string      // Hangi kullanıcı
  joined_at: string    // Listeye ne zaman katıldı
}
