import { supabase } from '../../supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MarketplaceProduct = {
  id: string
  name: string
  price: number
  image: string | null
  category: string
  quantity: number
  flashDeal: {
    id: string
    flashPrice: number
    originalPrice: number
    flashQuantity: number
    soldQuantity: number
    startAt: string
    endAt: string
  } | null
  discount: {
    id: string
    discountType: 'percentage' | 'fixed'
    discountValue: number
    promotionId: string
  } | null
}

export type MarketplaceFlashDeal = {
  id: string
  productId: string
  productName: string
  productImage: string | null
  flashPrice: number
  originalPrice: number
  flashQuantity: number
  soldQuantity: number
  startAt: string
  endAt: string
  purchaseLimit: number | null
}

export type MarketplaceVoucher = {
  id: string
  code: string
  name: string | null
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minSpend: number
  maxDiscount: number | null
  usageLimit: number | null
  usedCount: number
  startAt: string
  endAt: string
}

export type MarketplaceBundle = {
  id: string
  name: string | null
  price: number | null
  currency: string
  items: Array<{
    productId: string
    productName: string
    productImage: string | null
    productPrice: number
    quantity: number
  }>
}

export type MarketplaceAddonDeal = {
  id: string
  name: string
  triggerProductId: string
  triggerProductName: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  addonItems: Array<{
    productId: string
    productName: string
    productImage: string | null
    productPrice: number
    requiredQuantity: number
  }>
}

export type CartItem = {
  productId: string
  name: string
  price: number
  originalPrice: number
  quantity: number
  image: string | null
  flashDealId: string | null
  discountId: string | null
}

export type CheckoutResult = {
  success: boolean
  message: string
  itemsPurchased: number
  totalPaid: number
  discountsSaved: number
  voucherSaved: number
}

// ---------------------------------------------------------------------------
// Resolve the demo shop ID (first shop in DB or a specific one)
// ---------------------------------------------------------------------------

let cachedShopId: string | null = null

export async function getDemoShopId(): Promise<string> {
  if (cachedShopId) return cachedShopId

  const { data, error } = await supabase
    .from('shops')
    .select('id')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data?.id) throw new Error('No shop found in the database.')

  cachedShopId = data.id
  return data.id
}

// ---------------------------------------------------------------------------
// Marketplace product listing
// ---------------------------------------------------------------------------

export async function listMarketplaceProducts(shopId: string): Promise<MarketplaceProduct[]> {
  const now = new Date().toISOString()

  // Fetch products
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select(
      'product_id,prodname,price,quantity,image,status,categories:categories!products_category_id_fkey(name)',
    )
    .eq('shop_id', shopId)
    .eq('status', 'avail')
    .order('created_at', { ascending: false })

  if (prodErr) throw prodErr

  // Fetch active flash deals
  const { data: flashDeals } = await supabase
    .from('flash_deals')
    .select('id,product_id,flash_price,original_price,flash_quantity,sold_quantity,start_at,end_at')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)

  // Fetch active product discounts
  const { data: discounts } = await supabase
    .from('product_discounts')
    .select('id,product_id,discount_type,discount_value,promotion_id')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)

  const flashMap = new Map<string, (typeof flashDeals extends (infer T)[] | null ? T : never)>()
  for (const fd of flashDeals ?? []) {
    flashMap.set(fd.product_id, fd)
  }

  const discountMap = new Map<string, (typeof discounts extends (infer T)[] | null ? T : never)>()
  for (const d of discounts ?? []) {
    discountMap.set(d.product_id, d)
  }

  return (products ?? []).map((p: any) => {
    const fd = flashMap.get(p.product_id)
    const d = discountMap.get(p.product_id)

    return {
      id: p.product_id,
      name: p.prodname ?? 'Unnamed Product',
      price: p.price ?? 0,
      image: p.image ?? null,
      category: p.categories?.name?.trim() || 'Uncategorized',
      quantity: p.quantity ?? 0,
      flashDeal: fd
        ? {
            id: fd.id,
            flashPrice: fd.flash_price,
            originalPrice: fd.original_price,
            flashQuantity: fd.flash_quantity,
            soldQuantity: fd.sold_quantity ?? 0,
            startAt: fd.start_at,
            endAt: fd.end_at,
          }
        : null,
      discount: d
        ? {
            id: d.id,
            discountType: d.discount_type as 'percentage' | 'fixed',
            discountValue: d.discount_value,
            promotionId: d.promotion_id,
          }
        : null,
    }
  })
}

// ---------------------------------------------------------------------------
// Flash deals listing
// ---------------------------------------------------------------------------

export async function listActiveFlashDeals(shopId: string): Promise<MarketplaceFlashDeal[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('flash_deals')
    .select(
      'id,product_id,flash_price,original_price,flash_quantity,sold_quantity,start_at,end_at,purchase_limit,products:products!flash_deals_product_fkey(prodname,image)',
    )
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)
    .order('end_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.products?.prodname?.trim() || 'Unnamed Product',
    productImage: row.products?.image ?? null,
    flashPrice: row.flash_price,
    originalPrice: row.original_price,
    flashQuantity: row.flash_quantity,
    soldQuantity: row.sold_quantity ?? 0,
    startAt: row.start_at,
    endAt: row.end_at,
    purchaseLimit: row.purchase_limit ?? null,
  }))
}

// ---------------------------------------------------------------------------
// Vouchers listing
// ---------------------------------------------------------------------------

export async function listClaimableVouchers(shopId: string): Promise<MarketplaceVoucher[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('vouchers')
    .select('id,code,name,discount_type,discount_value,min_spend,max_discount,usage_limit,used_count,start_at,end_at')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)
    .order('created_at', { ascending: false })

  if (error) throw error

  return (data ?? []).filter((v: any) => {
    if (v.usage_limit && v.used_count >= v.usage_limit) return false
    return true
  }).map((v: any) => ({
    id: v.id,
    code: v.code,
    name: v.name,
    discountType: v.discount_type as 'percentage' | 'fixed',
    discountValue: v.discount_value,
    minSpend: v.min_spend ?? 0,
    maxDiscount: v.max_discount ?? null,
    usageLimit: v.usage_limit,
    usedCount: v.used_count ?? 0,
    startAt: v.start_at,
    endAt: v.end_at,
  }))
}

// ---------------------------------------------------------------------------
// Bundles listing
// ---------------------------------------------------------------------------

export async function listActiveBundles(shopId: string): Promise<MarketplaceBundle[]> {
  const now = new Date().toISOString()

  // Get active discount_sections of type 'bundle'
  const { data: sections } = await supabase
    .from('discount_section')
    .select('id')
    .eq('shop_id', shopId)
    .eq('campaign_type', 'bundle')
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)

  if (!sections || sections.length === 0) return []

  const sectionIds = sections.map((s: any) => s.id)

  const { data: bundles, error } = await supabase
    .from('bundles')
    .select('id,name,price,currency,bundle_items:bundle_items(product_id,quantity,products:products!bundle_items_product_id_fkey(prodname,image,price))')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .in('promotion_id', sectionIds)

  if (error) throw error

  return (bundles ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    price: b.price ? Number(b.price) : null,
    currency: b.currency ?? 'USD',
    items: (b.bundle_items ?? []).map((item: any) => ({
      productId: item.product_id,
      productName: item.products?.prodname?.trim() || 'Unnamed Product',
      productImage: item.products?.image ?? null,
      productPrice: item.products?.price ?? 0,
      quantity: item.quantity ?? 1,
    })),
  }))
}

// ---------------------------------------------------------------------------
// Add-on deals listing
// ---------------------------------------------------------------------------

export async function listActiveAddonDeals(shopId: string): Promise<MarketplaceAddonDeal[]> {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('addon_deals')
    .select(
      'id,name,trigger_product_id,discount_type,discount_value,products:products!addon_deals_trigger_product_id_fkey(prodname),addon_deal_items(product_id,required_quantity,products:products!addon_deal_items_product_id_fkey(prodname,image,price))',
    )
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)

  if (error) throw error

  return (data ?? []).map((deal: any) => ({
    id: deal.id,
    name: deal.name,
    triggerProductId: deal.trigger_product_id,
    triggerProductName: deal.products?.prodname?.trim() || 'Unnamed Product',
    discountType: deal.discount_type as 'percentage' | 'fixed',
    discountValue: deal.discount_value,
    addonItems: (deal.addon_deal_items ?? []).map((item: any) => ({
      productId: item.product_id,
      productName: item.products?.prodname?.trim() || 'Unnamed Product',
      productImage: item.products?.image ?? null,
      productPrice: item.products?.price ?? 0,
      requiredQuantity: item.required_quantity ?? 1,
    })),
  }))
}

// ---------------------------------------------------------------------------
// Voucher validation
// ---------------------------------------------------------------------------

export async function validateVoucher(
  code: string,
  cartTotal: number,
  shopId: string,
): Promise<{ valid: boolean; message: string; discount: number; voucherId: string | null }> {
  const trimmedCode = code.trim().toUpperCase()
  if (!trimmedCode) {
    return { valid: false, message: 'Please enter a voucher code.', discount: 0, voucherId: null }
  }

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('vouchers')
    .select('id,code,discount_type,discount_value,min_spend,max_discount,usage_limit,used_count,start_at,end_at')
    .eq('shop_id', shopId)
    .eq('code', trimmedCode)
    .eq('is_active', true)
    .maybeSingle()

  if (error) return { valid: false, message: 'Error looking up voucher.', discount: 0, voucherId: null }
  if (!data) return { valid: false, message: 'Invalid voucher code.', discount: 0, voucherId: null }

  const startMs = new Date(data.start_at).getTime()
  const endMs = new Date(data.end_at).getTime()
  const nowMs = new Date(now).getTime()

  if (nowMs < startMs || nowMs > endMs) {
    return { valid: false, message: 'This voucher has expired or is not active yet.', discount: 0, voucherId: null }
  }

  if (data.usage_limit && (data.used_count ?? 0) >= data.usage_limit) {
    return { valid: false, message: 'This voucher has reached its usage limit.', discount: 0, voucherId: null }
  }

  const minSpend = data.min_spend ?? 0
  if (cartTotal < minSpend) {
    return {
      valid: false,
      message: `Minimum spend of ₱${minSpend.toFixed(2)} required.`,
      discount: 0,
      voucherId: null,
    }
  }

  let discount = 0
  if (data.discount_type === 'percentage') {
    discount = cartTotal * (data.discount_value / 100)
    if (data.max_discount && discount > data.max_discount) {
      discount = data.max_discount
    }
  } else {
    discount = data.discount_value
  }

  discount = Math.min(discount, cartTotal)

  return {
    valid: true,
    message: `Voucher applied! You save ₱${discount.toFixed(2)}`,
    discount,
    voucherId: data.id,
  }
}

// ---------------------------------------------------------------------------
// Checkout simulation
// ---------------------------------------------------------------------------

export async function simulateCheckout(
  items: CartItem[],
  voucherId: string | null,
  voucherDiscount: number,
  _shopId: string,
): Promise<CheckoutResult> {
  try {
    let totalPaid = 0
    let discountsSaved = 0

    for (const item of items) {
      const itemTotal = item.price * item.quantity
      const originalTotal = item.originalPrice * item.quantity
      totalPaid += itemTotal
      discountsSaved += originalTotal - itemTotal

      // Update flash deal sold_quantity
      if (item.flashDealId) {
        const { data: fd } = await supabase
          .from('flash_deals')
          .select('sold_quantity')
          .eq('id', item.flashDealId)
          .single()

        if (fd) {
          await supabase
            .from('flash_deals')
            .update({
              sold_quantity: (fd.sold_quantity ?? 0) + item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.flashDealId)
        }

        // Also decrement product stock
        const { data: prod } = await supabase
          .from('products')
          .select('quantity')
          .eq('product_id', item.productId)
          .single()

        if (prod) {
          await supabase
            .from('products')
            .update({
              quantity: Math.max((prod.quantity ?? 0) - item.quantity, 0),
              updated_at: new Date().toISOString(),
            })
            .eq('product_id', item.productId)
        }
      }

      // Update product discount used_count
      if (item.discountId) {
        const { data: disc } = await supabase
          .from('product_discounts')
          .select('used_count')
          .eq('id', item.discountId)
          .single()

        if (disc) {
          await supabase
            .from('product_discounts')
            .update({
              used_count: (disc.used_count ?? 0) + item.quantity,
              updated_at: new Date().toISOString(),
            })
            .eq('id', item.discountId)
        }
      }
    }

    // Update voucher usage
    if (voucherId && voucherDiscount > 0) {
      const { data: voucher } = await supabase
        .from('vouchers')
        .select('used_count,total_used')
        .eq('id', voucherId)
        .single()

      if (voucher) {
        await supabase
          .from('vouchers')
          .update({
            used_count: (voucher.used_count ?? 0) + 1,
            total_used: (voucher.total_used ?? 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', voucherId)
      }

      // Insert voucher_usage record (user_id optional for demo)
      await supabase.from('voucher_usages').insert({
        voucher_id: voucherId,
        user_id: '00000000-0000-0000-0000-000000000000', // demo placeholder UUID
        used_at: new Date().toISOString(),
      })

      totalPaid = Math.max(totalPaid - voucherDiscount, 0)
    }

    const itemsPurchased = items.reduce((sum, item) => sum + item.quantity, 0)

    return {
      success: true,
      message: 'Demo purchase completed successfully!',
      itemsPurchased,
      totalPaid,
      discountsSaved,
      voucherSaved: voucherDiscount,
    }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Checkout failed.',
      itemsPurchased: 0,
      totalPaid: 0,
      discountsSaved: 0,
      voucherSaved: 0,
    }
  }
}

// ---------------------------------------------------------------------------
// Reset demo data
// ---------------------------------------------------------------------------

export async function resetDemoData(shopId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Reset flash deals sold_quantity
    await supabase
      .from('flash_deals')
      .update({ sold_quantity: 0, updated_at: new Date().toISOString() })
      .eq('shop_id', shopId)

    // Reset voucher usage
    await supabase
      .from('vouchers')
      .update({
        used_count: 0,
        total_used: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('shop_id', shopId)

    // Reset product discounts used_count
    await supabase
      .from('product_discounts')
      .update({ used_count: 0, updated_at: new Date().toISOString() })
      .eq('shop_id', shopId)

    // Reset bundle and addon used_count
    await supabase
      .from('bundles')
      .update({ used_count: 0, updated_at: new Date().toISOString() })
      .eq('shop_id', shopId)

    await supabase
      .from('addon_deals')
      .update({ used_count: 0, updated_at: new Date().toISOString() })
      .eq('shop_id', shopId)

    // Delete demo voucher_usages (those with placeholder user_id)
    await supabase
      .from('voucher_usages')
      .delete()
      .eq('user_id', '00000000-0000-0000-0000-000000000000')

    return { success: true, message: 'Demo data has been reset successfully.' }
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Failed to reset demo data.',
    }
  }
}
