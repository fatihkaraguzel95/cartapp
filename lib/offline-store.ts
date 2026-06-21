// ============================================================
// lib/offline-store.ts — Çevrimdışı Veri Depolama (IndexedDB)
// ============================================================
// Bu modül; ürünleri, listeleri, sepet içeriklerini ve
// çevrimdışıyken yapılan bekleyen değişiklikleri IndexedDB'de saklar.
// İnternet olmadığında veriler buradan okunur.
// İnternet geldiğinde bekleyen değişiklikler sunucuya gönderilir.
// ============================================================

import { Product, ShoppingList, ListItem } from '@/types'

const DB_NAME = 'cartapp-db'
const DB_VERSION = 1

// Çevrimdışıyken sıraya alınan değişiklik
export interface PendingMutation {
  id: string                      // Yerel benzersiz ID
  type: 'add_item' | 'remove_item'
  listId: string                  // Hangi listeye ait
  data: {
    list_id: string
    product_id: string
    added_by?: string
    quantity?: number
    unit?: string
  }
  tempItemId?: string             // add_item için: state'te kullanılan geçici ID
  timestamp: number               // Sıralama için
}

let dbInstance: IDBDatabase | null = null

// IndexedDB bağlantısını aç (singleton)
function getDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)

    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      dbInstance = req.result
      resolve(dbInstance)
    }

    req.onupgradeneeded = ({ target }) => {
      const db = (target as IDBOpenDBRequest).result

      if (!db.objectStoreNames.contains('products'))
        db.createObjectStore('products', { keyPath: 'id' })

      if (!db.objectStoreNames.contains('lists'))
        db.createObjectStore('lists', { keyPath: 'id' })

      if (!db.objectStoreNames.contains('listItems')) {
        const s = db.createObjectStore('listItems', { keyPath: 'id' })
        s.createIndex('byList', 'list_id')
      }

      if (!db.objectStoreNames.contains('pendingMutations')) {
        const s = db.createObjectStore('pendingMutations', { keyPath: 'id' })
        s.createIndex('byList', 'listId')
      }
    }
  })
}

// Yardımcı: tek kayıt oku
function txGet<T>(db: IDBDatabase, store: string, key: IDBValidKey): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Yardımcı: tüm kayıtları oku
function txGetAll<T>(db: IDBDatabase, store: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Yardımcı: index ile kayıt oku
function txGetByIndex<T>(db: IDBDatabase, store: string, index: string, key: IDBValidKey): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).index(index).getAll(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Yardımcı: kayıt yaz (birden fazla destekler)
function txPut(db: IDBDatabase, store: string, ...items: unknown[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite')
    const s = tx.objectStore(store)
    items.forEach(item => s.put(item))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// Yardımcı: kayıt sil
function txDelete(db: IDBDatabase, store: string, key: IDBValidKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// ---- Ürünler ----

export async function saveProducts(products: Product[]): Promise<void> {
  if (!products.length) return
  const db = await getDB()
  await txPut(db, 'products', ...products)
}

export async function getProducts(): Promise<Product[]> {
  const db = await getDB()
  return txGetAll<Product>(db, 'products')
}

// ---- Listeler ----

export async function saveList(list: ShoppingList): Promise<void> {
  const db = await getDB()
  await txPut(db, 'lists', list)
}

export async function saveLists(lists: ShoppingList[]): Promise<void> {
  if (!lists.length) return
  const db = await getDB()
  await txPut(db, 'lists', ...lists)
}

export async function getList(id: string): Promise<ShoppingList | null> {
  const db = await getDB()
  const result = await txGet<ShoppingList>(db, 'lists', id)
  return result ?? null
}

export async function getLists(): Promise<ShoppingList[]> {
  const db = await getDB()
  return txGetAll<ShoppingList>(db, 'lists')
}

// ---- Sepet Ürünleri ----

// Bir listenin sepet içeriğini tamamen güncelle (sunucudan yenileme sonrası)
export async function saveListItems(listId: string, items: ListItem[]): Promise<void> {
  const db = await getDB()
  const existing = await txGetByIndex<ListItem>(db, 'listItems', 'byList', listId)
  const tx = db.transaction('listItems', 'readwrite')
  const s = tx.objectStore('listItems')
  existing.forEach(item => s.delete(item.id))
  items.forEach(item => s.put(item))
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res()
    tx.onerror = () => rej(tx.error)
  })
}

export async function getListItems(listId: string): Promise<ListItem[]> {
  const db = await getDB()
  return txGetByIndex<ListItem>(db, 'listItems', 'byList', listId)
}

// Tek bir ürün kaydını IndexedDB'ye kaydet (çevrimdışı ekleme sonrası)
export async function addOfflineItem(item: ListItem): Promise<void> {
  const db = await getDB()
  await txPut(db, 'listItems', item)
}

// Tek bir ürün kaydını IndexedDB'den sil
export async function removeOfflineItem(itemId: string): Promise<void> {
  const db = await getDB()
  await txDelete(db, 'listItems', itemId)
}

// ---- Bekleyen Değişiklikler ----

export async function addPendingMutation(
  mutation: Omit<PendingMutation, 'id' | 'timestamp'>
): Promise<PendingMutation> {
  const db = await getDB()
  const full: PendingMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
  await txPut(db, 'pendingMutations', full)
  return full
}

export async function getPendingMutations(listId?: string): Promise<PendingMutation[]> {
  const db = await getDB()
  const all = listId
    ? await txGetByIndex<PendingMutation>(db, 'pendingMutations', 'byList', listId)
    : await txGetAll<PendingMutation>(db, 'pendingMutations')
  return all.sort((a, b) => a.timestamp - b.timestamp)
}

export async function removePendingMutation(id: string): Promise<void> {
  const db = await getDB()
  await txDelete(db, 'pendingMutations', id)
}
