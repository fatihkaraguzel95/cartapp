export interface Product {
  id: string
  name_tr: string
  name_de: string
  category: string
  emoji: string
  search_terms?: string
}

export interface ShoppingList {
  id: string
  name: string
  join_code: string
  owner_id: string
  created_at: string
}

export interface ListItem {
  id: string
  list_id: string
  product_id: string
  added_by: string
  added_at: string
}

export interface ListMember {
  id: string
  list_id: string
  user_id: string
  joined_at: string
}
