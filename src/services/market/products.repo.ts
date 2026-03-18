import { supabase } from '../../supabase'

export type ShopProduct = {
  id: string
  name: string
  category: string
  price: number
  stock: number
  sales: number
  status: string
  image: string | null
}

export type ShopCategory = {
  id: string
  name: string
}

type ProductsListResult = {
  items: ShopProduct[]
  authRequired: boolean
  noShop: boolean
}

type CategoriesListResult = {
  items: ShopCategory[]
  authRequired: boolean
  noShop: boolean
}

type ProductRow = {
  product_id: string
  prodname: string
  price: number | null
  quantity: number | null
  status: string
  image: string | null
  image_url?: string | null
  categories?: { name?: string | null } | null
}

type CategoryRow = {
  id: string
  name: string
  active: boolean | null
  position: number | null
}

async function getCurrentUserShopId() {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) {
    throw userError
  }

  const userId = userData.user?.id
  if (!userId) {
    return { authRequired: true, shopId: null as string | null, noShop: false }
  }

  const { data: shopRow, error: shopError } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', userId)
    .maybeSingle()

  if (shopError) {
    throw shopError
  }

  return {
    authRequired: false,
    shopId: shopRow?.id ?? null,
    noShop: !shopRow?.id,
  }
}

export async function listShopProducts(): Promise<ProductsListResult> {
  const { authRequired, shopId, noShop } = await getCurrentUserShopId()
  if (authRequired || !shopId) {
    return { items: [], authRequired, noShop }
  }

  const { data, error } = await supabase
    .from('products')
    .select(
      'product_id,prodname,price,quantity,status,image,image_url,categories:categories!products_category_id_fkey(name)',
    )
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as ProductRow[]
  const items: ShopProduct[] = rows.map((row) => ({
    id: row.product_id,
    name: row.prodname,
    category: row.categories?.name?.trim() || 'Uncategorized',
    price: typeof row.price === 'number' ? row.price : 0,
    stock: typeof row.quantity === 'number' ? row.quantity : 0,
    sales: 0,
    status: row.status ?? 'avail',
    image: row.image_url ?? row.image ?? null,
  }))

  return {
    items,
    authRequired: false,
    noShop: false,
  }
}

export async function listShopCategories(): Promise<CategoriesListResult> {
  const { authRequired, noShop } = await getCurrentUserShopId()
  if (authRequired) {
    return { items: [], authRequired, noShop: false }
  }

  const { data, error } = await supabase
    .from('categories')
    .select('id,name,active,position')
    .eq('active', true)
    .order('position', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    throw error
  }

  const rows = (data ?? []) as CategoryRow[]
  const items = rows.map((row) => ({
    id: row.id,
    name: row.name?.trim() || 'Unnamed Category',
  }))

  return {
    items,
    authRequired: false,
    noShop,
  }
}
