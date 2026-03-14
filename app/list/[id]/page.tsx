'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getSupabase } from '@/lib/supabase'
import { Product, ShoppingList, ListItem } from '@/types'

const EMOJIS = [
  '🍎','🍌','🍊','🍋','🍇','🍓','🫐','🍑','🍒','🍐','🥭','🍍','🥝','🥑','🍅',
  '🥦','🥕','🧅','🧄','🥔','🌽','🫑','🥒','🍆','🥬','🌿','🍄','🫘','🌶',
  '🥩','🍗','🍖','🥚','🧀','🥛','🧈','🍞','🥖','🫓',
  '🐟','🦐','🫒','🥜','🌾',
  '☕','🍵','🥤','💧','🍺','🍷','🧃',
  '🍫','🍪','🍯','🥐','🍕','🌭','🥗',
  '🧴','🧺','🧻','🪥','🧼','🪒','🗑️','🛍️',
  '🔋','💊','🧹','📦','🫙','🥫','🌱',
]

export default function ListPage() {
  const params = useParams()
  const listId = params.id as string
  const router = useRouter()

  const [user, setUser] = useState<{ id: string } | null>(null)
  const [list, setList] = useState<ShoppingList | null>(null)
  const [cartItems, setCartItems] = useState<ListItem[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Product[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Custom product modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customNameDe, setCustomNameDe] = useState('')
  const [customEmoji, setCustomEmoji] = useState('🛒')
  const [addingCustom, setAddingCustom] = useState(false)

  const inCart = useCallback((productId: string) => {
    return cartItems.some(item => item.product_id === productId)
  }, [cartItems])

  useEffect(() => {
    const supabase = getSupabase()
    let cleanup: (() => void) | undefined

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/'); return }
      setUser(user)

      const { data: listData } = await supabase
        .from('shopping_lists').select('*').eq('id', listId).single()
      if (!listData) { router.push('/dashboard'); return }
      setList(listData)

      const { count } = await supabase
        .from('list_members').select('*', { count: 'exact', head: true }).eq('list_id', listId)
      setMemberCount(count || 0)

      const { data: items } = await supabase
        .from('list_items').select('*').eq('list_id', listId)
      setCartItems(items || [])

      const { data: products } = await supabase
        .from('products').select('*').order('name_tr')
      setAllProducts(products || [])

      setLoading(false)

      const channel = supabase
        .channel(`list-${listId}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'list_items',
          filter: `list_id=eq.${listId}`
        }, async () => {
          const { data: refreshed } = await supabase
            .from('list_items').select('*').eq('list_id', listId)
          setCartItems(refreshed || [])
        })
        .on('postgres_changes', {
          event: 'INSERT', schema: 'public', table: 'products'
        }, async () => {
          const { data: products } = await supabase
            .from('products').select('*').order('name_tr')
          setAllProducts(products || [])
        })
        .subscribe()

      cleanup = () => { supabase.removeChannel(channel) }
    }

    init()
    return () => { cleanup?.() }
  }, [listId, router])

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

  const toggleProduct = async (product: Product) => {
    if (toggling) return
    setToggling(product.id)
    const supabase = getSupabase()

    if (inCart(product.id)) {
      await supabase.from('list_items').delete()
        .eq('list_id', listId).eq('product_id', product.id)
      setCartItems(prev => prev.filter(item => item.product_id !== product.id))
    } else {
      const { data } = await supabase.from('list_items')
        .insert({ list_id: listId, product_id: product.id, added_by: user!.id })
        .select().single()
      if (data) setCartItems(prev => [...prev, data])
    }
    setToggling(null)
  }

  const addCustomProduct = async () => {
    if (!customName.trim() || !user) return
    setAddingCustom(true)
    const supabase = getSupabase()

    // Insert into products table (permanent)
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

    // Add to local products list immediately
    setAllProducts(prev => [...prev, product])

    // Add to cart
    const { data: item } = await supabase
      .from('list_items')
      .insert({ list_id: listId, product_id: product.id, added_by: user.id })
      .select().single()
    if (item) setCartItems(prev => [...prev, item])

    setCustomName('')
    setCustomNameDe('')
    setCustomEmoji('🛒')
    setShowAddModal(false)
    setAddingCustom(false)
  }

  const copyCode = async () => {
    if (!list) return
    try { await navigator.clipboard.writeText(list.join_code) } catch { }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const cartProducts = cartItems
    .map(item => allProducts.find(p => p.id === item.product_id))
    .filter(Boolean) as Product[]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-lg">Yükleniyor...</div>
      </div>
    )
  }

  const isSearching = searchQuery.trim().length > 0

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-10">
      {/* Header */}
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
          {/* Add custom product button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-700 text-white rounded-xl px-3 py-2 text-sm font-bold flex-shrink-0 active:scale-95 transition-all"
          >
            + Yeni
          </button>
        </div>

        {/* Search bar */}
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
                {searchResults.map(product => {
                  const isInCart = inCart(product.id)
                  return (
                    <button
                      key={product.id}
                      onClick={() => toggleProduct(product)}
                      disabled={toggling === product.id}
                      className={`rounded-2xl p-4 text-center flex flex-col items-center gap-2 transition-all border-2 active:scale-95 disabled:opacity-70 ${
                        isInCart ? 'bg-green-950 border-green-600' : 'bg-red-950 border-red-900'
                      }`}
                    >
                      <span className="text-5xl leading-none">{product.emoji}</span>
                      <div className="w-full">
                        <div className="font-semibold text-sm leading-tight">{product.name_tr}</div>
                        <div className="text-slate-400 text-xs mt-0.5">{product.name_de}</div>
                      </div>
                      {isInCart
                        ? <span className="text-xs bg-green-600 text-white px-2.5 py-0.5 rounded-full font-medium">✓ Sepette</span>
                        : <span className="text-xs bg-red-900 text-red-300 px-2.5 py-0.5 rounded-full">+ Ekle</span>
                      }
                    </button>
                  )
                })}
              </div>
            )}
          </>
        ) : (
          <>
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

            {cartProducts.length === 0 ? (
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
                {cartProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product)}
                    disabled={toggling === product.id}
                    className="bg-green-950 border-2 border-green-600 rounded-2xl p-4 text-center flex flex-col items-center gap-2 active:scale-95 transition-all disabled:opacity-70"
                  >
                    <span className="text-5xl leading-none">{product.emoji}</span>
                    <div className="w-full">
                      <div className="font-semibold text-sm leading-tight">{product.name_tr}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{product.name_de}</div>
                    </div>
                    <span className="text-xs bg-green-600 text-white px-2.5 py-0.5 rounded-full font-medium">✓ Sepette</span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Custom Product Modal */}
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

            {/* Emoji picker */}
            <div className="mb-4">
              <p className="text-slate-400 text-xs mb-2 font-medium">Simge Seç</p>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-5xl">{customEmoji}</span>
                <div className="flex-1 bg-slate-800 rounded-xl p-2 max-h-32 overflow-y-auto">
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

            {/* Name inputs */}
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
              {addingCustom ? '...' : `${customEmoji} Ekle ve Sepete At`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
