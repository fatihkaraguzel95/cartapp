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
// - Çevrimdışı destek: internet olmadan verileri göster, değişiklikleri kaydet
// ============================================================

'use client' // Tarayıcıda çalışır (state, event, realtime subscription kullandığı için)

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Product, ShoppingList, ListItem } from '@/types'
import {
  saveProducts, getProducts,
  saveList, getList,
  saveListItems, getListItems,
  addOfflineItem, removeOfflineItem,
  addPendingMutation, getPendingMutations, removePendingMutation,
} from '@/lib/offline-store'

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

  // Çevrimdışı durum
  const [isOnline, setIsOnline] = useState(true)                      // İnternet bağlantısı var mı?
  const [pendingCount, setPendingCount] = useState(0)                 // Bekleyen değişiklik sayısı
  const userRef = useRef<{ id: string } | null>(null)                 // Online event'te kullanıcıya erişim için

  // Çıkarılan ürünler (bu oturumda kaldırılan, kırmızı bölümde gösterilen)
  const [removedItems, setRemovedItems] = useState<Map<string, { product: Product; cartItem: ListItem }>>(new Map())

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

  // --- ÇEVRİMDIŞI: BEKLEYEN DEĞİŞİKLİKLERİ SUNUCUYA GÖNDER ---
  const processOfflineQueue = useCallback(async () => {
    const supabase = getSupabase()
    const mutations = await getPendingMutations(listId).catch(() => [])
    let processed = 0

    for (const mut of mutations) {
      try {
        if (mut.type === 'add_item') {
          const { error } = await supabase.from('list_items').insert(mut.data)
          // Zaten eklenmişse (duplicate) hata görmezden gel
          if (!error || error.code === '23505') {
            await removePendingMutation(mut.id)
            processed++
          }
        } else if (mut.type === 'remove_item') {
          await supabase.from('list_items').delete()
            .eq('list_id', mut.data.list_id)
            .eq('product_id', mut.data.product_id)
          await removePendingMutation(mut.id)
          processed++
        }
      } catch {
        // Hata olursa bu değişiklik bir sonraki bağlantıda tekrar denenecek
      }
    }

    // Sunucudan güncel veriyi çek
    const { data: items } = await supabase.from('list_items').select('*').eq('list_id', listId)
    if (items) {
      setCartItems(items)
      await saveListItems(listId, items).catch(() => {})
    }

    const { data: products } = await supabase.from('products').select('*').order('name_tr')
    if (products) {
      setAllProducts(products)
      await saveProducts(products).catch(() => {})
    }

    const remaining = mutations.length - processed
    setPendingCount(Math.max(0, remaining))
  }, [listId])

  // --- ÇEVRİMİÇİ/ÇEVRİMDIŞI DURUM TAKİBİ ---
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    setIsOnline(navigator.onLine)

    const handleOnline = async () => {
      setIsOnline(true)
      if (userRef.current) {
        await processOfflineQueue()
      }
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [processOfflineQueue])

  // --- SAYFA YÜKLENDİĞİNDE ÇALIŞIR ---
  useEffect(() => {
    const supabase = getSupabase()
    let cleanup: (() => void) | undefined // Sayfa kapanınca realtime aboneliğini temizle

    const init = async () => {
      // Oturum kontrolü (localStorage'dan okunur — çevrimdışı da çalışır)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/'); return }
      const currentUser = session.user
      setUser(currentUser)
      userRef.current = currentUser

      const online = typeof navigator !== 'undefined' ? navigator.onLine : true

      if (online) {
        // --- ÇEVRİMİÇİ: Sunucudan yükle, IndexedDB'ye kaydet ---

        // Liste bilgisini yükle
        const { data: listData } = await supabase
          .from('shopping_lists').select('*').eq('id', listId).single()

        if (listData) {
          setList(listData)
          await saveList(listData).catch(() => {})
        } else {
          // Sunucuda bulunamazsa önbellekten dene
          const cached = await getList(listId).catch(() => null)
          if (!cached) { router.push('/dashboard'); return }
          setList(cached)
        }

        // Listedeki üye sayısını yükle
        const { count } = await supabase
          .from('list_members').select('*', { count: 'exact', head: true }).eq('list_id', listId)
        setMemberCount(count || 0)

        // Sepetteki ürünleri yükle
        const { data: items } = await supabase
          .from('list_items').select('*').eq('list_id', listId)
        const serverItems = items || []
        setCartItems(serverItems)
        await saveListItems(listId, serverItems).catch(() => {})

        // Tüm ürünleri yükle (arama için gerekli)
        const { data: products } = await supabase
          .from('products').select('*').order('name_tr')
        const serverProducts = products || []
        setAllProducts(serverProducts)
        await saveProducts(serverProducts).catch(() => {})

        // Bekleyen çevrimdışı değişiklikleri say
        const pending = await getPendingMutations(listId).catch(() => [])
        setPendingCount(pending.length)

        // --- GERÇEK ZAMANLI GÜNCELLEMELER (REALTIME) ---
        const channel = supabase
          .channel(`list-${listId}`)
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'list_items',
            filter: `list_id=eq.${listId}`
          }, async () => {
            const { data: refreshed } = await supabase
              .from('list_items').select('*').eq('list_id', listId)
            const refreshedItems = refreshed || []
            setCartItems(refreshedItems)
            await saveListItems(listId, refreshedItems).catch(() => {})
          })
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'products'
          }, async () => {
            const { data: products } = await supabase
              .from('products').select('*').order('name_tr')
            const newProducts = products || []
            setAllProducts(newProducts)
            await saveProducts(newProducts).catch(() => {})
          })
          .subscribe()

        cleanup = () => { supabase.removeChannel(channel) }

      } else {
        // --- ÇEVRİMDIŞI: IndexedDB'den yükle ---

        const cachedList = await getList(listId).catch(() => null)
        if (!cachedList) { router.push('/dashboard'); return }
        setList(cachedList)

        const cachedItems = await getListItems(listId).catch(() => [])
        setCartItems(cachedItems)

        const cachedProducts = await getProducts().catch(() => [])
        setAllProducts(cachedProducts)

        const pending = await getPendingMutations(listId).catch(() => [])
        setPendingCount(pending.length)
      }

      setLoading(false)
    }

    init()
    return () => { cleanup?.() }
  }, [listId, router])

  // --- ARAMA ---
  useEffect(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) { setSearchResults([]); return }

    const results = allProducts.filter(p =>
      p.name_tr.toLowerCase().includes(q) ||
      p.name_de.toLowerCase().includes(q) ||
      (p.search_terms && p.search_terms.toLowerCase().includes(q))
    )
    setSearchResults(results)
  }, [searchQuery, allProducts])

  // --- TILE'A TIKLAMA ---
  const handleTileClick = (product: Product) => {
    if (toggling) return
    if (inCart(product.id)) {
      // Sepetteki ürün tıklandı: kırmızıya al, çıkarılanlar bölümüne ekle
      const cartItem = cartItems.find(i => i.product_id === product.id)
      if (cartItem) {
        setRemovedItems(prev => new Map(prev).set(product.id, { product, cartItem }))
      }
      removeProduct(product)
    } else {
      setSelectedQuantity(1)
      setSelectedUnit('adet')
      setPendingProduct(product)
    }
  }

  // --- ÇIKARILANI GERİ EKLE ---
  const restoreItem = async (productId: string) => {
    const entry = removedItems.get(productId)
    if (!entry || !user) return
    setToggling(productId)

    setRemovedItems(prev => {
      const next = new Map(prev)
      next.delete(productId)
      return next
    })

    const supabase = getSupabase()

    if (!navigator.onLine) {
      const tempId = 'offline-' + crypto.randomUUID()
      const tempItem: ListItem = {
        id: tempId,
        list_id: listId,
        product_id: productId,
        added_by: user.id,
        quantity: entry.cartItem.quantity,
        unit: entry.cartItem.unit,
        added_at: new Date().toISOString(),
      }
      setCartItems(prev => [...prev, tempItem])
      await addOfflineItem(tempItem).catch(() => {})
      await addPendingMutation({
        type: 'add_item',
        listId,
        data: { list_id: listId, product_id: productId, added_by: user.id, quantity: entry.cartItem.quantity, unit: entry.cartItem.unit },
        tempItemId: tempId,
      }).catch(() => {})
      setPendingCount(c => c + 1)
      setToggling(null)
      return
    }

    const { data } = await supabase.from('list_items')
      .insert({ list_id: listId, product_id: productId, added_by: user.id, quantity: entry.cartItem.quantity, unit: entry.cartItem.unit })
      .select().single()

    if (data) {
      setCartItems(prev => [...prev, data])
      await addOfflineItem(data).catch(() => {})
    }
    setToggling(null)
  }

  // --- ÜRÜNDEN ÇIKAR ---
  const removeProduct = async (product: Product) => {
    setToggling(product.id)
    const supabase = getSupabase()
    const cartItem = cartItems.find(i => i.product_id === product.id)

    if (!navigator.onLine) {
      // Çevrimdışı mod
      if (cartItem) {
        if (cartItem.id.startsWith('offline-')) {
          // Çevrimdışı eklenen ürün: sıradan ilgili add_item mutasyonunu sil
          const mutations = await getPendingMutations(listId).catch(() => [])
          const addMut = mutations.find(m => m.type === 'add_item' && m.tempItemId === cartItem.id)
          if (addMut) {
            await removePendingMutation(addMut.id).catch(() => {})
            setPendingCount(c => Math.max(0, c - 1))
          }
        } else {
          // Sunucuda kayıtlı ürün: remove_item sıraya al
          await addPendingMutation({
            type: 'remove_item',
            listId,
            data: { list_id: listId, product_id: product.id },
          }).catch(() => {})
          setPendingCount(c => c + 1)
        }
        await removeOfflineItem(cartItem.id).catch(() => {})
      }
      setCartItems(prev => prev.filter(i => i.product_id !== product.id))
      setToggling(null)
      return
    }

    // Çevrimiçi mod
    await supabase.from('list_items').delete()
      .eq('list_id', listId).eq('product_id', product.id)
    setCartItems(prev => prev.filter(item => item.product_id !== product.id))
    if (cartItem) await removeOfflineItem(cartItem.id).catch(() => {})
    setToggling(null)
  }

  // --- SEPETE EKLE (MİKTAR/BİRİM İLE) ---
  const confirmAddToCart = async () => {
    if (!pendingProduct || !user) return
    setToggling(pendingProduct.id)
    const supabase = getSupabase()

    if (!navigator.onLine) {
      // Çevrimdışı mod: geçici ID ile yerel kayıt oluştur, sıraya al
      const tempId = 'offline-' + crypto.randomUUID()
      const tempItem: ListItem = {
        id: tempId,
        list_id: listId,
        product_id: pendingProduct.id,
        added_by: user.id,
        quantity: selectedQuantity,
        unit: selectedUnit,
        added_at: new Date().toISOString(),
      }
      setCartItems(prev => [...prev, tempItem])
      await addOfflineItem(tempItem).catch(() => {})
      await addPendingMutation({
        type: 'add_item',
        listId,
        data: {
          list_id: listId,
          product_id: pendingProduct.id,
          added_by: user.id,
          quantity: selectedQuantity,
          unit: selectedUnit,
        },
        tempItemId: tempId,
      }).catch(() => {})
      setPendingCount(c => c + 1)
      setPendingProduct(null)
      setToggling(null)
      return
    }

    // Çevrimiçi mod
    const { data, error } = await supabase.from('list_items')
      .insert({
        list_id: listId,
        product_id: pendingProduct.id,
        added_by: user.id,
        quantity: selectedQuantity,
        unit: selectedUnit,
      })
      .select().single()

    if (error) alert('Hata: ' + error.message + ' | ' + error.code)
    if (data) {
      setCartItems(prev => [...prev, data])
      await addOfflineItem(data).catch(() => {})
    }
    setPendingProduct(null)
    setToggling(null)
  }

  // --- ÖZEL ÜRÜN EKLE ---
  const addCustomProduct = async () => {
    if (!customName.trim() || !user) return
    setAddingCustom(true)
    const supabase = getSupabase()

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name_tr: customName.trim(),
        name_de: customNameDe.trim() || customName.trim(),
        category: 'ozel',
        emoji: customEmoji,
        is_custom: true,
        created_by: user.id,
      })
      .select().single()

    if (error || !product) {
      setAddingCustom(false)
      return
    }

    setAllProducts(prev => [...prev, product])
    await saveProducts([product]).catch(() => {})

    setCustomName('')
    setCustomNameDe('')
    setCustomEmoji('🛒')
    setShowAddModal(false)
    setAddingCustom(false)

    setSelectedQuantity(1)
    setSelectedUnit('adet')
    setPendingProduct(product)
  }

  // --- KODU KOPYALA ---
  const copyCode = async () => {
    if (!list) return
    try { await navigator.clipboard.writeText(list.join_code) } catch { }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Sepetteki ürünlerin tam bilgisini (emoji, isim vb.) getir
  const cartProducts = cartItems
    .map(item => allProducts.find(p => p.id === item.product_id))
    .filter(Boolean) as Product[]

  // Son zamanlarda eklenen ürünler — added_at'e göre azalan, ilk 6
  const recentlyAddedItems = [...cartItems]
    .sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
    .slice(0, 6)
    .map(item => allProducts.find(p => p.id === item.product_id))
    .filter(Boolean) as Product[]

  // Çıkarılan ürünler listesi
  const removedList = Array.from(removedItems.values())

  // --- YÜKLENİYOR EKRANI ---
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Yükleniyor...</div>
      </div>
    )
  }

  const isSearching = searchQuery.trim().length > 0

  // --- ÜRÜN TILE BİLEŞENİ ---
  const ProductTile = ({ product }: { product: Product }) => {
    const cartItem = getCartItem(product.id)
    const isInCart = !!cartItem
    return (
      <button
        onClick={() => handleTileClick(product)}
        disabled={toggling === product.id}
        className={`rounded-2xl p-4 text-center flex flex-col items-center gap-2 transition-all border-2 active:scale-95 disabled:opacity-70 ${
          isInCart
            ? 'bg-green-950 border-green-600'
            : 'bg-slate-800 border-slate-700'
        }`}
      >
        <span className="text-5xl leading-none">{product.emoji}</span>
        <div className="w-full">
          <div className="font-semibold text-sm leading-tight">{product.name_tr}</div>
          <div className="text-slate-400 text-xs mt-0.5">{product.name_de}</div>
        </div>
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

      {/* Çevrimdışı banner */}
      {!isOnline && (
        <div className="bg-amber-900 border-b border-amber-700 text-amber-200 text-xs text-center py-2 px-4">
          {pendingCount > 0
            ? `Çevrimdışı — ${pendingCount} değişiklik bağlantı gelince gönderilecek`
            : 'Çevrimdışı — önbellekten gösteriliyor'}
        </div>
      )}

      {/* Üst bar — ekranda sabit kalır */}
      <div className="bg-slate-900 border-b border-slate-800 sticky top-0 z-20">
        <div className="px-4 pt-3 pb-2 flex items-center gap-3">

          <button onClick={() => router.push('/dashboard')} className="text-slate-400 text-2xl w-8 flex-shrink-0">←</button>

          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-base leading-tight truncate">{list?.name}</h1>
            <div className="flex items-center gap-3 mt-0.5">
              <button
                onClick={copyCode}
                className="text-xs bg-slate-800 rounded-lg px-2.5 py-1 font-mono tracking-widest text-slate-300 active:scale-95 transition-all"
              >
                {copied ? '✓ Kopyalandı!' : list?.join_code}
              </button>
              <span className="text-xs text-slate-500">👥 {memberCount} kişi</span>
            </div>
          </div>

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

        {/* ARAMA MODU */}
        {isSearching ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-slate-500 text-xs">
                {searchResults.length === 0 ? 'Sonuç yok' : `${searchResults.length} ürün bulundu`}
              </p>
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
              <div className="text-center py-10 text-slate-500">
                <div className="text-4xl mb-3">🔍</div>
                <p>Listede yok — yukarıdan ekleyebilirsin</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {searchResults.map(product => <ProductTile key={product.id} product={product} />)}
              </div>
            )}
          </>

        ) : (
          /* NORMAL MOD */
          <>
            {/* SON ZAMANLARDA EKLENENLER */}
            {recentlyAddedItems.length > 0 && (
              <div className="mb-5">
                <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                  Son Eklenenler
                </h2>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {recentlyAddedItems.map(product => {
                    const cartItem = getCartItem(product.id)
                    return (
                      <div
                        key={product.id}
                        className="flex-shrink-0 bg-slate-800 border border-slate-700 rounded-2xl px-3 py-2 flex items-center gap-2 min-w-max"
                      >
                        <span className="text-2xl">{product.emoji}</span>
                        <div className="text-left">
                          <div className="text-xs font-semibold leading-tight">{product.name_tr}</div>
                          {cartItem && (
                            <div className="text-xs text-green-400">{cartItem.quantity} {cartItem.unit}</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* SEPET */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Sepet — {cartProducts.length} ürün
              </h2>
              {cartProducts.length > 0 && (
                <button
                  onClick={() => searchInputRef.current?.focus()}
                  className="text-xs text-green-400 font-medium"
                >
                  + Ürün ekle
                </button>
              )}
            </div>

            {cartProducts.length === 0 && removedList.length === 0 ? (
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
              <div className="grid grid-cols-2 gap-3">
                {cartProducts.map(product => <ProductTile key={product.id} product={product} />)}
              </div>
            )}

            {/* ÇIKARILANLAR BÖLÜMÜ */}
            {removedList.length > 0 && (
              <div className="mt-6">
                <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
                  Çıkarılanlar — {removedList.length} ürün
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  {removedList.map(({ product, cartItem }) => (
                    <button
                      key={product.id}
                      onClick={() => restoreItem(product.id)}
                      disabled={toggling === product.id}
                      className="rounded-2xl p-4 text-center flex flex-col items-center gap-2 transition-all border-2 active:scale-95 disabled:opacity-70 bg-red-950 border-red-800"
                    >
                      <span className="text-5xl leading-none opacity-60">{product.emoji}</span>
                      <div className="w-full">
                        <div className="font-semibold text-sm leading-tight text-red-200 line-through">{product.name_tr}</div>
                        <div className="text-red-400 text-xs mt-0.5">{product.name_de}</div>
                      </div>
                      <span className="text-xs bg-red-800 text-red-200 px-2.5 py-0.5 rounded-full font-medium">
                        {cartItem.quantity} {cartItem.unit} · geri al
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ============================================================ */}
      {/* MİKTAR/BİRİM SEÇİM MODALI */}
      {/* ============================================================ */}
      {pendingProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={() => setPendingProduct(null)}>
          <div
            className="bg-slate-900 rounded-t-3xl w-full max-w-lg p-5 pb-8"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="text-5xl">{pendingProduct.emoji}</span>
              <div>
                <div className="font-bold text-base">{pendingProduct.name_tr}</div>
                <div className="text-slate-400 text-sm">{pendingProduct.name_de}</div>
              </div>
              <button onClick={() => setPendingProduct(null)} className="ml-auto text-slate-400 text-2xl w-8 h-8 flex items-center justify-center">×</button>
            </div>

            {/* MİKTAR SEÇİCİ */}
            <div className="mb-4">
              <p className="text-slate-400 text-xs mb-2 font-medium uppercase tracking-wider">Miktar</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedQuantity(q => Math.max(1, q - 1))}
                  className="w-12 h-12 rounded-2xl bg-slate-800 text-2xl font-bold flex items-center justify-center active:scale-90 transition-all"
                >−</button>
                <span className="text-3xl font-bold w-12 text-center">{selectedQuantity}</span>
                <button
                  onClick={() => setSelectedQuantity(q => Math.min(99, q + 1))}
                  className="w-12 h-12 rounded-2xl bg-slate-800 text-2xl font-bold flex items-center justify-center active:scale-90 transition-all"
                >+</button>
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
                <span className="text-5xl">{customEmoji}</span>
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
