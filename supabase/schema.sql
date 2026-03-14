-- ============================================================
-- Alışveriş Listesi - Database Schema
-- ============================================================

-- Products table (pre-seeded with TR/DE products)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_tr TEXT NOT NULL,
  name_de TEXT NOT NULL,
  category TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🛒',
  search_terms TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping lists
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  join_code TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- List members
CREATE TABLE IF NOT EXISTS public.list_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- List items (cart items)
CREATE TABLE IF NOT EXISTS public.list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  added_by UUID REFERENCES auth.users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, product_id)
);

-- ============================================================
-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_list_member(p_list_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.list_members
    WHERE list_id = p_list_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_list_owner(p_list_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shopping_lists
    WHERE id = p_list_id AND owner_id = p_user_id
  );
$$;

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_items ENABLE ROW LEVEL SECURITY;

-- Products: everyone can read
CREATE POLICY "products_read_all" ON public.products
  FOR SELECT USING (true);

-- Shopping lists policies
CREATE POLICY "lists_select" ON public.shopping_lists
  FOR SELECT USING (
    owner_id = auth.uid() OR
    public.is_list_member(id, auth.uid())
  );

CREATE POLICY "lists_insert" ON public.shopping_lists
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "lists_update" ON public.shopping_lists
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "lists_delete" ON public.shopping_lists
  FOR DELETE USING (owner_id = auth.uid());

-- List members policies
CREATE POLICY "members_select" ON public.list_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.is_list_member(list_id, auth.uid()) OR
    public.is_list_owner(list_id, auth.uid())
  );

CREATE POLICY "members_insert" ON public.list_members
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "members_delete" ON public.list_members
  FOR DELETE USING (user_id = auth.uid());

-- List items policies
CREATE POLICY "items_select" ON public.list_items
  FOR SELECT USING (
    public.is_list_member(list_id, auth.uid()) OR
    public.is_list_owner(list_id, auth.uid())
  );

CREATE POLICY "items_insert" ON public.list_items
  FOR INSERT WITH CHECK (
    public.is_list_member(list_id, auth.uid()) OR
    public.is_list_owner(list_id, auth.uid())
  );

CREATE POLICY "items_delete" ON public.list_items
  FOR DELETE USING (
    public.is_list_member(list_id, auth.uid()) OR
    public.is_list_owner(list_id, auth.uid())
  );

-- ============================================================
-- Enable Realtime
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_members;
