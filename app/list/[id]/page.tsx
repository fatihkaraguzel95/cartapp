// ============================================================
// app/list/[id]/page.tsx — Alışveriş Listesi Sayfası
// ============================================================
// Bu sayfa bir alışveriş listesini gösterir.
// [id] dinamik bir parametredir: hangi listenin ID'si URL'de varsa o liste açılır.
// Örnek URL: /list/a1b2c3d4-...
//
// Özellikler:
// - Sepetteki ürünleri göster (yeşil kutucuklar)
// - Ürün arama (Türkçe veya Almanca)
// - Ürünü sepete ekle — miktar ve birim seçimi ile
// - Ürünü sepetten çıkar
// - Yeni özel ürün oluştur
// - Gerçek zamanlı güncelleme: başka kullanıcı ürün eklediğinde anında yansır
// ============================================================

'use client' // Tarayıcıda çalışır (state, event, realtime subscription kullandığı için)

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Product, ShoppingList, ListItem } from '@/types'

// --- EMOJİ LİSTESİ ---
// Özel ürün oluştururken seçilebilecek emojiler.
// Market alışverişiyle ilgili kategorilere göre düzenlenmiştir.
const EMOJIS = [
  // Meyveler
  '🍎','🍏','🍌','🍊','🍋','🍇','🍓','🫐','🍑','🍒','🍐','🥭','🍍','🥝','🥑','🍅','🍉','🍈',
  // Sebzeler
  '🥦','🥕','🧅','🧄','🥔','🌽','🫑','🥒','🍆','🥬','🌿','🍄','🫘','🌶','🥜','🌰','🫚','🧂',
  // Et & Protein
  '🥩','🍗','🍖','🥓','🥚','🍳','🐟','🦐','🦀','🦑',
  // Süt & Kahvaltılık
  '🧀','🥛','🧈','🍯','🥞','🧇',
  // Ekmek & Tahıl
  '🍞','🥖','🫓','🥐','🥨','🥯','🌾','🫙','🥫',
  // İçecekler
  '☕','🍵','💧','🥤','🧃','🧋','🫖','🍺','🍷',
  // Atıştırmalık & Tatlı
  '🍫','🍪','🍿','🧁','🍩','🍬','🍭','🍰',
  // Hazır & Dondurulmuş Gıda
  '🍕','🌮','🥙','🥗','🌭','🥣','🍱','🫕','🧊',
  // Temizlik & Kişisel Bakım
  '🧴','🧼','🧻','🪥','🪒','🧽','🧺','🫧',
  // Ev & Diğer
  '💊','🔋','🧹','🌱','📦','🛍️',
]

// --- BİRİM SEÇENEKLERİ ---
// Ürün eklerken seçilebilecek ölçü birimleri.
const UNITS = ['adet', 'paket', 'kutu', 'kg', 'g', '100g', '250g', '500g', 'litre', 'ml', 'şişe', 'demet', 'dilim', 'tane', 'çift']

export default function ListPage() {
  // URL parametrelerini al: /list/[id] → params.id
  const params = useParams()
  const listId = params.id as string
  const router = useRouter()

  // --- STATE ---

  const [user, setUser] = useState<{ id: string } | null>(null)       // Giriş yapmış kullanıcı
  const [list, setList] = useState<ShoppingList | null>(null)          // Bu listenin bilgileri (isim, kod vb.)
  const [cartItems, setCartItems] = useState<ListItem[]>([])           // Sepetteki ürün kayıtları
  const [allProducts, setAllProducts] = useState<Product[]>([])        // Tüm ürünler (arama için)
  const [searchQuery, setSearchQuery] = useState('')                   // Arama kutusundaki metin
  const [searchResults, setSearchResults] = useState<Product[]>([])   // Arama sonuçları
  const [memberCount, setMemberCount] = useState(0)                    // Listedeki toplam üye sayısı
  const [loading, setLoading] = useState(true)                        // Sayfa yükleniyor mu?
  const [copied, setCopied] = useState(false)                         // "Kopyalandı!" mesajı gösterilsin mi?
  const [toggling, setToggling] = useState<string | null>(null)       // Şu an işlem yapılan ürünün ID'si
  const searchInputRef = useRef<HTMLInputElement>(null)                // Arama kutusuna programatik odaklanmak için

  // Özel ürün ekleme modal state'leri
  const [showAddModal, setShowAddModal] = useState(false)    // Modal açık mı?
  const [customName, setCustomName] = useState('')           // Türkçe ürün adı
  const [customNameDe, setCustomNameDe] = useState('')       // Almanca ürün adı
  const [customEmoji, setCustomEmoji] = useState('🛒')      // Seçilen emoji
  const [addingCustom, setAddingCustom] = useState(false)   // Ekleme işlemi devam ediyor mu?

  // Miktar/birim seçim modal state'leri
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null) // Sepete eklenecek ürün (seçim bekleniyor)
  const [selectedQuantity, setSelectedQuantity] = useState(1)               // Seçilen miktar (varsayılan: 1)
  const [selectedUnit, setSelectedUnit] = useState('adet')                  // Seçilen birim (varsayılan: adet)

  // --- YARDIMCI FONKSİYONLAR ---

  // Belirtilen ürünün sepet kaydını döndürür (miktar ve birim bilgisiyle birlikte)
  // useCallback: bu fonksiyon sadece cartItems değiştiğinde yeniden oluşturulur (performans optimizasyonu)
  const getCartItem = useCallback((productId: string) => {
    return cartItems.find(item => item.product_id === productId) ?? null
  }, [cartItems])

  // Ürünün sepette olup olmadığını kontrol eder (true/false döner)
  const inCart = useCallback((productId: string) => {
    return cartItems.some(item => item.product_id === productId)
  }, [cartItems])

  // --- SAYFA YÜKLENDİĞİNDE ÇALIŞIR ---
  useEffect(() => {
    const supabase = getSupabase()
    let cleanup: (() => void) | undefined // Sayfa kapanınca realtime aboneliğini temizle

    const init = async () => {
      // Oturum kontrolü
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      const user = session.user
      setUser(user)

      // Liste bilgisini yükle
      const { data: listData } = await supabase
        .from('shopping_lists').select('*').eq('id', listId).single()
      if (!listData) { router.push('/dashboard'); return } // Liste bulunamazsa dashboard'a dön
      setList(listData)

      // Listedeki üye sayısını yükle
      const { count } = await supabase
        .from('list_members').select('*', { count: 'exact', head: true }).eq('list_id', listId)
      setMemberCount(count || 0)

      // Sepetteki ürünleri yükle
      const { data: items } = await supabase
        .from('list_items').select('*').eq('list_id', listId)
      setCartItems(items || [])

      // Tüm ürünleri yükle (arama için gerekli)
      const { data: products } = await supabase
        .from('products').select('*').order('name_tr')
      setAllProducts(products || [])

      setLoading(false)

      // --- GERÇEK ZAMANLI GÜNCELLEMELER (REALTIME) ---
      // Başka bir kullanıcı ürün eklediğinde veya çıkardığında otomatik güncellenir.
      const channel = supabase
        .channel(`list-${listId}`) // Her liste için benzersiz bir kanal
        .on('postgres_changes', {
          event: '*',            // INSERT, UPDATE, DELETE hepsini dinle
          schema: 'public',
          table: 'list_items',
          filter: `list_id=eq.${listId}` // Sadece bu listedeki değişiklikler
        }, async () => {
          // Değişiklik olunca tüm sepet içeriğini yeniden yükle
          const { data: refreshed } = await supabase
            .from('list_items').select('*').eq('list_id', listId)
          setCartItems(refreshed || [])
        })
        .on('postgres_changes', {
          event: 'INSERT', // Yeni ürün eklendiğinde
          schema: 'public',
          table: 'products'
        }, async () => {
          // Ürün listesini güncelle (yeni özel ürün başkası tarafından eklendiyse)
          const { data: products } = await supabase
            .from('products').select('*').order('name_tr')
          setAllProducts(products || [])
        })
        .subscribe()

      // cleanup: bileşen bellekten silindiğinde (sayfa kapatıldığında) kanalı kapat
      cleanup = () => { supabase.removeChannel(channel) }
    }

    init()
    return () => { cleanup?.() } // React'ın temizleme mekanizması
  }, [listId, router])

  // --- ARAMA ---
  // searchQuery her değiştiğinde bu effect çalışır ve sonuçları filtreler.
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) { setSearchResults([]); return } // Arama kutusu boşsa sonuçları temizle

    // Türkçe isim, Almanca isim veya arama terimleri içinde ara
    const results = allProducts.filter(p =>
      p.name_tr.toLowerCase().includes(q) ||
      p.name_de.toLowerCase().includes(q) ||
      (p.search_terms && p.search_terms.toLowerCase().includes(q))
    )
    setSearchResults(results)
  }, [searchQuery, allProducts])

  // --- TILE'A TIKLAMA ---
  // Ürün kutucuğuna tıklandığında:
  // - Sepetteyse: direkt çıkar
  // - Sepette değilse: miktar/birim seçim modalını aç
  const handleTileClick = (product: Product) => {
    if (toggling) return // Başka bir işlem varsa bekle
    if (inCart(product.id)) {
      removeProduct(product)
    } else {
      // Modalı açmadan önce varsayılan değerlere sıfırla
      setSelectedQuantity(1)
      setSelectedUnit('adet')
      setPendingProduct(product)
    }
  }

  // --- ÜRÜNDEN ÇIKAR ---
  const removeProduct = async (product: Product) => {
    setToggling(product.id) // Bu ürünün işlem yaptığını işaretle (çift tıklamayı engeller)
    const supabase = getSupabase()
    await supabase.from('list_items').delete()
      .eq('list_id', listId).eq('product_id', product.id)
    // Sepetten çıkarılanı yerel state'den de sil (sayfayı yeniden yüklemeden)
    setCartItems(prev => prev.filter(item => item.product_id !== product.id))
    setToggling(null)
  }

  // --- SEPETE EKLE (MİKTAR/BİRİM İLE) ---
  // Kullanıcı miktar/birim seçip onayladıktan sonra bu fonksiyon çalışır.
  const confirmAddToCart = async () => {
    if (!pendingProduct || !user) return
    setToggling(pendingProduct.id)
    const supabase = getSupabase()

    // Veritabanına ekle: liste ID, ürün ID, kimin eklediği, miktar, birim
    const { data } = await supabase.from('list_items')
      .insert({
        list_id: listId,
        product_id: pendingProduct.id,
        added_by: user.id,
        quantity: selectedQuantity,
        unit: selectedUnit,
      })
      .select().single() // Eklenen kaydı geri al

    if (data) setCartItems(prev => [...prev, data]) // Sepete yerel olarak da ekle
    setPendingProduct(null) // Modalı kapat
    setToggling(null)
  }

  // --- ÖZEL ÜRÜN EKLE ---
  // Veritabanında olmayan bir ürünü kullanıcı kendisi oluşturabilir.
  // Bu ürün "products" tablosuna eklenir ve kalıcı olur (herkes görebilir).
  const addCustomProduct = async () => {
    if (!customName.trim() || !user) return
    setAddingCustom(true)
    const supabase = getSupabase()

    // Ürünü products tablosuna ekle
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name_tr: customName.trim(),
        name_de: customNameDe.trim() || customName.trim(), // Almanca boşsa Türkçe'yi kullan
        category: 'ozel',    // Özel kategori
        emoji: customEmoji,
        is_custom: true,     // Kullanıcı tarafından oluşturuldu
        created_by: user.id, // Kim oluşturdu
      })
      .select().single()

    if (error || !product) {
      setAddingCustom(false)
      return
    }

    // Yeni ürünü yerel ürün listesine ekle (realtime gelene kadar anında görünsün)
    setAllProducts(prev => [...prev, product])

    // Formu sıfırla ve modalı kapat
    setCustomName('')
    setCustomNameDe('')
    setCustomEmoji('🛒')
    setShowAddModal(false)
    setAddingCustom(false)

    // Özel ürün için de miktar/birim seçim modalını aç
    setSelectedQuantity(1)
    setSelectedUnit('adet')
    setPendingProduct(product)
  }

  // --- KODU KOPYALA ---
  // Katılma kodunu panoya kopyalar ve 2 saniye "Kopyalandı!" gösterir.
  const copyCode = async () => {
    if (!list) return
    try { await navigator.clipboard.writeText(list.join_code) } catch { }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Sepetteki ürünlerin tam bilgisini (emoji, isim vb.) getir
  // cartItems sadece ID'leri tutar, allProducts'tan tam bilgiyi bul
  const cartProducts = cartItems
    .map(item => allProducts.find(p => p.id === item.product_id))
    .filter(Boolean) as Product[]

  // --- YÜKLENİYOR EKRANI ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Yükleniyor...</div>
      </div>
    )
  }

  // Arama yapılıyor mu? (arama kutusu dolu mu?)
  const isSearching = searchQuery.trim().length > 0

  // --- ÜRÜN TILE BİLEŞENİ ---
  // Her ürün için gösterilen kutucuk.
  // Sepetteyse yeşil + miktar/birim, değilse gri + "Ekle" gösterir.
  const ProductTile = ({ product }: { product: Product }) => {
    const cartItem = getCartItem(product.id)
    const isInCart = !!cartItem
    return (
      <button
        onClick={() => handleTileClick(product)}
        disabled={toggling === product.id} // İşlem yapılırken buton devre dışı
        className={`rounded-2xl p-4 text-center flex flex-col items-center gap-2 transition-all border-2 active:scale-95 disabled:opacity-70 ${
          isInCart
            ? 'bg-green-950 border-green-600'  // Sepetteyse yeşil
            : 'bg-slate-800 border-slate-700'  // Değilse gri
        }`}
      >
        {/* Büyük emoji */}
        <span className="text-5xl leading-none">{product.emoji}</span>

        {/* Ürün adları */}
        <div className="w-full">
          <div className="font-semibold text-sm leading-tight">{product.name_tr}</div>
          <div className="text-slate-400 text-xs mt-0.5">{product.name_de}</div>
        </div>

        {/* Durum etiketi: sepetteyse miktar+birim, değilse "+Ekle" */}
        {isInCart ? (
          <span className="text-xs bg-green-600 text-white px-2.5 py-0.5 rounded-full font-medium">
            ✓ {cartItem.quantity} {cartItem.unit}
          </span>
        ) : (
          <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full">+ Ekle</span>
        )}
      </button>
    )
  }

  // --- ANA EKRAN ---
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-10">

      {/* Üst bar — ekranda sabit kalır */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">

          {/* Geri butonu */}
          <button onClick={() => router.push('/dashboard')} className="text-slate-400 text-2xl w-8 flex-shrink-0">←</button>

          <div className="flex-1 min-w-0">
            {/* Liste adı */}
            <h1 className="font-bold text-base leading-tight truncate">{list?.name}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              {/* Katılma kodu butonu — tıklanınca panoya kopyalar */}
              <button
                onClick={copyCode}
                className="text-xs bg-slate-800 rounded-lg px-2.5 py-1 font-mono tracking-widest text-slate-300 active:scale-95 transition-all"
              >
                {copied ? '✓ Kopyalandı!' : list?.join_code}
              </button>
              {/* Üye sayısı */}
              <span className="text-xs text-slate-500">👥 {memberCount} kişi</span>
            </div>
          </div>

          {/* Yeni özel ürün ekleme butonu */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-700 text-white rounded-xl px-3 py-2 text-sm font-bold flex-shrink-0 active:scale-95 transition-all"
          >
            + Yeni
          </button>
        </div>

        {/* Arama çubuğu */}
        <div className="px-4 pb-3">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg">🔍</span>
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Ürün ara... Türkçe veya Almanca"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800 rounded-2xl pl-10 pr-10 py-3.5 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
            />
            {/* Temizle butonu — arama kutusu doluysa göster */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl w-7 h-7 flex items-center justify-center"
              >×</button>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto">

        {/* ARAMA MODU: Kullanıcı bir şey yazıyorsa arama sonuçlarını göster */}
        {isSearching ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 text-xs">
                {searchResults.length === 0 ? 'Sonuç yok' : `${searchResults.length} ürün bulundu`}
              </p>
              {/* Sonuç yoksa "bu isimle ekle" butonu göster */}
              {searchResults.length === 0 && (
                <button
                  onClick={() => { setCustomName(searchQuery); setShowAddModal(true) }}
                  className="text-xs text-green-400 font-semibold bg-green-950 px-3 py-1.5 rounded-lg active:scale-95"
                >
                  + &quot;{searchQuery}&quot; ekle
                </button>
              )}
            </div>

            {searchResults.length === 0 ? (
              // Hiç sonuç yok
              <div className="text-center py-10 text-slate-500">
                <div className="text-4xl mb-3">🔍</div>
                <p>Listede yok — yukarıdan ekleyebilirsin</p>
              </div>
            ) : (
              // Arama sonuçlarını 2 sütunlu grid olarak göster
              <div className="grid grid-cols-2 gap-3">
                {searchResults.map(product => <ProductTile key={product.id} product={product} />)}
              </div>
            )}
          </>

        ) : (
          /* NORMAL MOD: Arama yapılmıyorsa sepetteki ürünleri göster */
          <>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Sepet — {cartProducts.length} ürün
              </h2>
              {/* Sepet doluysa "ürün ekle" bağlantısı göster */}
              {cartProducts.length > 0 && (
                <button
                  onClick={() => searchInputRef.current?.focus()} // Arama kutusuna odaklan
                  className="text-xs text-green-400 font-medium"
                >
                  + Ürün ekle
                </button>
              )}
            </div>

            {cartProducts.length === 0 ? (
              // Sepet boş
              <div className="text-center py-16 text-slate-500">
                <div className="text-6xl mb-4">🛒</div>
                <p className="font-medium text-slate-400">Sepet boş</p>
                <p className="text-sm mt-1">Arama yapın veya yeni ürün ekleyin</p>
                <div className="flex gap-3 justify-center mt-4">
                  <button
                    onClick={() => searchInputRef.current?.focus()}
                    className="bg-slate-700 text-white px-5 py-3 rounded-2xl text-sm font-bold active:scale-95 transition-all"
                  >
                    🔍 Ara
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-green-700 text-white px-5 py-3 rounded-2xl text-sm font-bold active:scale-95 transition-all"
                  >
                    + Yeni Ürün
                  </button>
                </div>
              </div>
            ) : (
              // Sepetteki ürünleri 2 sütunlu grid olarak göster
              <div className="grid grid-cols-2 gap-3">
                {cartProducts.map(product => <ProductTile key={product.id} product={product} />)}
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* MİKTAR/BİRİM SEÇİM MODALI */}
      {/* Ürüne tıklandığında açılır, kullanıcı kaç tane ve hangi birimde */}
      {/* alacağını seçer, sonra sepete eklenir. */}
      {/* ============================================================ */}
      {pendingProduct && (
        // Arka plan — tıklanınca modalı kapat
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setPendingProduct(null)}>
          <div
            className="bg-slate-900 rounded-t-3xl w-full max-w-lg p-5 pb-8"
            onClick={e => e.stopPropagation()} // Modal içine tıklayınca kapanmasın
          >
            {/* Ürün bilgisi */}
            <div className="flex items-center gap-3 mb-5">
              <span className="text-5xl">{pendingProduct.emoji}</span>
              <div>
                <div className="font-bold text-base">{pendingProduct.name_tr}</div>
                <div className="text-slate-400 text-sm">{pendingProduct.name_de}</div>
              </div>
              {/* Kapat butonu */}
              <button onClick={() => setPendingProduct(null)} className="ml-auto text-slate-400 text-2xl w-8 h-8 flex items-center justify-center">×</button>
            </div>

            {/* MİKTAR SEÇİCİ */}
            <div className="mb-4">
              <p className="text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">Miktar</p>
              <div className="flex items-center gap-4">
                {/* Azalt butonu */}
                <button
                  onClick={() => setSelectedQuantity(q => Math.max(1, q - 1))} // Minimum 1
                  className="w-12 h-12 rounded-2xl bg-slate-800 text-2xl font-bold flex items-center justify-center active:scale-90 transition-all"
                >−</button>

                {/* Mevcut miktar */}
                <span className="text-3xl font-bold w-12 text-center">{selectedQuantity}</span>

                {/* Artır butonu */}
                <button
                  onClick={() => setSelectedQuantity(q => Math.min(99, q + 1))} // Maksimum 99
                  className="w-12 h-12 rounded-2xl bg-slate-800 text-2xl font-bold flex items-center justify-center active:scale-90 transition-all"
                >+</button>

                {/* Hızlı miktar seçenekleri */}
                <div className="flex gap-2 flex-wrap ml-2">
                  {[1, 2, 3, 5, 10].map(n => (
                    <button
                      key={n}
                      onClick={() => setSelectedQuantity(n)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-semibold transition-all active:scale-90 ${
                        selectedQuantity === n ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300'
                      }`}
                    >{n}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* BİRİM SEÇİCİ */}
            <div className="mb-5">
              <p className="text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">Birim</p>
              <div className="flex flex-wrap gap-2">
                {UNITS.map(unit => (
                  <button
                    key={unit}
                    onClick={() => setSelectedUnit(unit)}
                    className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all active:scale-90 ${
                      selectedUnit === unit ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >{unit}</button>
                ))}
              </div>
            </div>

            {/* Sepete ekle butonu */}
            <button
              onClick={confirmAddToCart}
              disabled={!!toggling}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-2xl py-4 active:scale-95 transition-all text-base"
            >
              {toggling ? '...' : `🛒 ${selectedQuantity} ${selectedUnit} sepete ekle`}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* ÖZEL ÜRÜN EKLEME MODALI */}
      {/* Veritabanında olmayan bir ürünü kullanıcı kendisi oluşturabilir. */}
      {/* ============================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setShowAddModal(false)}>
          <div
            className="bg-slate-900 rounded-t-3xl w-full max-w-lg p-5 pb-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Yeni Ürün Ekle</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 text-2xl w-8 h-8 flex items-center justify-center">×</button>
            </div>

            {/* EMOJİ SEÇİCİ */}
            <div className="mb-4">
              <p className="text-slate-400 text-xs mb-2 font-medium">Simge Seç</p>
              <div className="flex items-center gap-3 mb-2">
                {/* Seçili emoji büyük göster */}
                <span className="text-5xl">{customEmoji}</span>

                {/* Kaydırılabilir emoji grid */}
                <div className="flex-1 bg-slate-800 rounded-xl p-2 max-h-36 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map(e => (
                      <button
                        key={e}
                        onClick={() => setCustomEmoji(e)}
                        className={`text-2xl p-1 rounded-lg transition-all active:scale-90 ${
                          customEmoji === e ? 'bg-green-700' : 'hover:bg-slate-700'
                        }`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* ÜRÜN ADI GİRİŞLERİ */}
            <div className="space-y-3 mb-5">
              <input
                type="text"
                placeholder="Ürün adı (Türkçe) *"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                autoFocus
                className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
              />
              <input
                type="text"
                placeholder="Almanca adı (isteğe bağlı)"
                value={customNameDe}
                onChange={e => setCustomNameDe(e.target.value)}
                className="w-full bg-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder-slate-500"
              />
            </div>

            {/* Devam et butonu — miktar/birim seçimine geçer */}
            <button
              onClick={addCustomProduct}
              disabled={!customName.trim() || addingCustom}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold rounded-2xl py-4 active:scale-95 transition-all"
            >
              {addingCustom ? '...' : `${customEmoji} Devam Et →`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
