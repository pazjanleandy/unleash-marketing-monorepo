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
  shopId: string
  shopName: string
  shopOwnerId: string | null
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
  shopId: string
  shopName: string
  shopOwnerId: string | null
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
  shopId: string
  shopName: string
  shopOwnerId: string | null
}

export type MarketplaceBundle = {
  id: string
  name: string | null
  price: number | null
  currency: string
  shopId: string
  shopName: string
  shopOwnerId: string | null
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
  shopId: string
  shopName: string
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
  bundleId?: string | null
  bundleName?: string | null
  shopId: string
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
const DEMO_SHOP_ID = 'public-market'

function isDemoShop(shopId: string) {
  return shopId === DEMO_SHOP_ID
}

export async function getDemoShopId(): Promise<string> {
  if (cachedShopId) return cachedShopId
  cachedShopId = DEMO_SHOP_ID
  return DEMO_SHOP_ID
}

// ---------------------------------------------------------------------------
// Marketplace product listing
// ---------------------------------------------------------------------------

export async function listMarketplaceProducts(shopId: string): Promise<MarketplaceProduct[]> {
  const now = new Date().toISOString()

  // Fetch products
  const productsQuery = supabase
    .from('products')
    .select(
      'product_id,prodname,price,quantity,image,image_url,status,shop_id,shops:shops!products_shop_id_fkey(name,owner_id),categories:categories!products_category_id_fkey(name)',
    )
    .eq('status', 'avail')
    .order('created_at', { ascending: false })

  const { data: products, error: prodErr } = isDemoShop(shopId)
    ? await productsQuery
    : await productsQuery.eq('shop_id', shopId)

  if (prodErr) throw prodErr

  // Fetch active flash deals
  const flashDealsQuery = supabase
    .from('flash_deals')
    .select('id,product_id,flash_price,original_price,flash_quantity,sold_quantity,start_at,end_at')
    .eq('is_active', true)
    .or('voucher_type.is.null,voucher_type.neq.private')
    .lte('start_at', now)
    .gte('end_at', now)

  const { data: flashDeals } = isDemoShop(shopId)
    ? await flashDealsQuery
    : await flashDealsQuery.eq('shop_id', shopId)

  // Fetch active product discounts
  const discountsQuery = supabase
    .from('product_discounts')
    .select('id,product_id,discount_type,discount_value,promotion_id')
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)

  const { data: discounts } = isDemoShop(shopId)
    ? await discountsQuery
    : await discountsQuery.eq('shop_id', shopId)

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
      image: p.image_url ?? p.image ?? null,
      category: p.categories?.name?.trim() || 'Uncategorized',
      quantity: p.quantity ?? 0,
      shopId: p.shop_id,
      shopName: p.shops?.name?.trim() || 'Unknown Shop',
      shopOwnerId: p.shops?.owner_id ?? null,
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

  const query = supabase
    .from('flash_deals')
    .select(
      'id,product_id,shop_id,flash_price,original_price,flash_quantity,sold_quantity,start_at,end_at,purchase_limit,products:products!flash_deals_product_fkey(prodname,image,image_url),shops:shops!flash_deals_shop_fkey(name,owner_id)',
    )
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)
    .order('end_at', { ascending: true })

  const { data, error } = isDemoShop(shopId) ? await query : await query.eq('shop_id', shopId)

  if (error) throw error

  return (data ?? []).map((row: any) => ({
    id: row.id,
    productId: row.product_id,
    productName: row.products?.prodname?.trim() || 'Unnamed Product',
    productImage: row.products?.image_url ?? row.products?.image ?? null,
    flashPrice: row.flash_price,
    originalPrice: row.original_price,
    flashQuantity: row.flash_quantity,
    soldQuantity: row.sold_quantity ?? 0,
    startAt: row.start_at,
    endAt: row.end_at,
    purchaseLimit: row.purchase_limit ?? null,
    shopId: row.shop_id,
    shopName: row.shops?.name?.trim() || 'Unknown Shop',
    shopOwnerId: row.shops?.owner_id ?? null,
  }))
}

// ---------------------------------------------------------------------------
// Vouchers listing
// ---------------------------------------------------------------------------

export async function listClaimableVouchers(shopId: string): Promise<MarketplaceVoucher[]> {
  const now = new Date().toISOString()

  const query = supabase
    .from('vouchers')
    .select(
      'id,code,name,voucher_type,discount_type,discount_value,min_spend,max_discount,usage_limit,used_count,start_at,end_at,shop_id,shops:shops!vouchers_shop_fkey(name,owner_id)',
    )
    .eq('is_active', true)
    .or('voucher_type.is.null,voucher_type.neq.private')
    .lte('start_at', now)
    .gte('end_at', now)
    .order('created_at', { ascending: false })

  const { data, error } = isDemoShop(shopId) ? await query : await query.eq('shop_id', shopId)

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
    shopId: v.shop_id,
    shopName: v.shops?.name?.trim() || 'Unknown Shop',
    shopOwnerId: v.shops?.owner_id ?? null,
  }))
}

// ---------------------------------------------------------------------------
// Bundles listing
// ---------------------------------------------------------------------------

export async function listActiveBundles(shopId: string): Promise<MarketplaceBundle[]> {
  const now = new Date().toISOString()

  // Get active discount_sections of type 'bundle'
  const sectionsQuery = supabase
    .from('discount_section')
    .select('id')
    .eq('campaign_type', 'bundle')
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)

  const { data: sections } = isDemoShop(shopId)
    ? await sectionsQuery
    : await sectionsQuery.eq('shop_id', shopId)

  if (!sections || sections.length === 0) return []

  const sectionIds = sections.map((s: any) => s.id)

  const bundlesQuery = supabase
    .from('bundles')
    .select('id,name,price,currency,shop_id,shops:shops!bundles_shop_id_fkey(name,owner_id),bundle_items:bundle_items(product_id,quantity,products:products!bundle_items_product_id_fkey(prodname,image,image_url,price))')
    .eq('is_active', true)
    .in('promotion_id', sectionIds)

  const { data: bundles, error } = isDemoShop(shopId)
    ? await bundlesQuery
    : await bundlesQuery.eq('shop_id', shopId)

  if (error) throw error

  return (bundles ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    price: b.price ? Number(b.price) : null,
    currency: b.currency ?? 'USD',
    shopId: b.shop_id,
    shopName: b.shops?.name?.trim() || 'Unknown Shop',
    shopOwnerId: b.shops?.owner_id ?? null,
    items: (b.bundle_items ?? []).map((item: any) => ({
      productId: item.product_id,
      productName: item.products?.prodname?.trim() || 'Unnamed Product',
      productImage: item.products?.image_url ?? item.products?.image ?? null,
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

  const query = supabase
    .from('addon_deals')
    .select(
      'id,name,shop_id,trigger_product_id,discount_type,discount_value,products:products!addon_deals_trigger_product_id_fkey(prodname),addon_deal_items(product_id,required_quantity,products:products!addon_deal_items_product_id_fkey(prodname,image,image_url,price))',
    )
    .eq('is_active', true)
    .lte('start_at', now)
    .gte('end_at', now)

  const { data, error } = isDemoShop(shopId) ? await query : await query.eq('shop_id', shopId)

  if (error) throw error

  return (data ?? []).map((deal: any) => ({
    id: deal.id,
    name: deal.name,
    shopId: deal.shop_id,
    shopName: 'Unknown Shop',
    triggerProductId: deal.trigger_product_id,
    triggerProductName: deal.products?.prodname?.trim() || 'Unnamed Product',
    discountType: deal.discount_type as 'percentage' | 'fixed',
    discountValue: deal.discount_value,
    addonItems: (deal.addon_deal_items ?? []).map((item: any) => ({
      productId: item.product_id,
      productName: item.products?.prodname?.trim() || 'Unnamed Product',
      productImage: item.products?.image_url ?? item.products?.image ?? null,
      productPrice: item.products?.price ?? 0,
      requiredQuantity: item.required_quantity ?? 1,
    })),
  }))
}

// ---------------------------------------------------------------------------
// Voucher validation
// ---------------------------------------------------------------------------

function getUniqueCartShopIds(items: CartItem[]) {
  const ids = new Set<string>()
  for (const item of items) {
    if (item.shopId) {
      ids.add(item.shopId)
    }
  }
  return Array.from(ids)
}

export async function validateVoucher(
  code: string,
  cartTotal: number,
  shopId: string,
  cartItems: CartItem[],
): Promise<{ valid: boolean; message: string; discount: number; voucherId: string | null }> {
  const trimmedCode = code.trim().toUpperCase()
  if (!trimmedCode) {
    return { valid: false, message: 'Please enter a voucher code.', discount: 0, voucherId: null }
  }

  if (cartItems.length === 0) {
    return { valid: false, message: 'Add items to your cart first.', discount: 0, voucherId: null }
  }

  const cartShopIds = getUniqueCartShopIds(cartItems)
  if (cartShopIds.length > 1) {
    return {
      valid: false,
      message: 'Vouchers can only be used for items from a single shop.',
      discount: 0,
      voucherId: null,
    }
  }

  const now = new Date().toISOString()

  const baseQuery = supabase
    .from('vouchers')
    .select(
      'id,code,shop_id,voucher_type,metadata,discount_type,discount_value,min_spend,max_discount,usage_limit,used_count,start_at,end_at,voucher_products(product_id)',
    )
    .eq('code', trimmedCode)
    .eq('is_active', true)
  const scopedQuery = isDemoShop(shopId) ? baseQuery : baseQuery.eq('shop_id', shopId)
  const { data, error } = await scopedQuery.maybeSingle()

  if (error) return { valid: false, message: 'Error looking up voucher.', discount: 0, voucherId: null }
  if (!data) return { valid: false, message: 'Invalid voucher code.', discount: 0, voucherId: null }

  const cartShopId = cartShopIds[0]
  if (cartShopId && data.shop_id && data.shop_id !== cartShopId) {
    return {
      valid: false,
      message: 'This voucher is only valid for the shop that created it.',
      discount: 0,
      voucherId: null,
    }
  }

  const startMs = new Date(data.start_at).getTime()
  const endMs = new Date(data.end_at).getTime()
  const nowMs = new Date(now).getTime()

  if (nowMs < startMs || nowMs > endMs) {
    return { valid: false, message: 'This voucher has expired or is not active yet.', discount: 0, voucherId: null }
  }

  if (data.usage_limit && (data.used_count ?? 0) >= data.usage_limit) {
    return { valid: false, message: 'This voucher has reached its usage limit.', discount: 0, voucherId: null }
  }

  const voucherType = (() => {
    const metadata =
      data && typeof data.metadata === 'object' && data.metadata !== null
        ? (data.metadata as Record<string, unknown>)
        : {}
    const raw =
      (data.voucher_type as string | null) ??
      (metadata.voucher_type as string | undefined) ??
      (metadata.voucherType as string | undefined) ??
      (metadata.voucher_category as string | undefined) ??
      ''
    return typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  })()

  const isProductVoucher = voucherType === 'product'
  const linkedProducts = (data.voucher_products ?? [])
    .map((row: { product_id?: string | null }) => row.product_id)
    .filter((value: string | null | undefined): value is string => Boolean(value && value.trim()))

  const eligibleSubtotal = isProductVoucher
    ? cartItems.reduce(
        (sum, item) =>
          linkedProducts.includes(item.productId) ? sum + item.price * item.quantity : sum,
        0,
      )
    : cartTotal

  if (isProductVoucher) {
    if (linkedProducts.length === 0 || eligibleSubtotal <= 0) {
      return {
        valid: false,
        message: 'This voucher only applies to selected products.',
        discount: 0,
        voucherId: null,
      }
    }
  }

  const minSpend = data.min_spend ?? 0
  if (eligibleSubtotal < minSpend) {
    return {
      valid: false,
      message: `Minimum spend of ?${minSpend.toFixed(2)} required.`,
      discount: 0,
      voucherId: null,
    }
  }

  let discount = 0
  if (data.discount_type === 'percentage') {
    discount = eligibleSubtotal * (data.discount_value / 100)
    if (data.max_discount && discount > data.max_discount) {
      discount = data.max_discount
    }
  } else {
    discount = data.discount_value
  }

  discount = Math.min(discount, eligibleSubtotal)

  return {
    valid: true,
    message: `Voucher applied! You save ?${discount.toFixed(2)}`,
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
    if (!items || items.length === 0) {
      return {
        success: false,
        message: 'Your cart is empty.',
        itemsPurchased: 0,
        totalPaid: 0,
        discountsSaved: 0,
        voucherSaved: 0,
      }
    }

    const cartShopIds = getUniqueCartShopIds(items)
    if (voucherId && cartShopIds.length > 1) {
      return {
        success: false,
        message: 'Vouchers can only be used for items from a single shop.',
        itemsPurchased: 0,
        totalPaid: 0,
        discountsSaved: 0,
        voucherSaved: 0,
      }
    }

    const productQtyMap = new Map<string, number>()
    for (const item of items) {
      productQtyMap.set(item.productId, (productQtyMap.get(item.productId) ?? 0) + item.quantity)
    }

    let resolvedVoucherDiscount = 0
    let resolvedVoucherId: string | null = null

    if (voucherId) {
      const { data: voucher, error: voucherError } = await supabase
        .from('vouchers')
        .select(
          'id,shop_id,voucher_type,metadata,discount_type,discount_value,min_spend,max_discount,usage_limit,used_count,start_at,end_at,voucher_products(product_id)',
        )
        .eq('id', voucherId)
        .eq('is_active', true)
        .maybeSingle()

      if (voucherError || !voucher) {
        return {
          success: false,
          message: 'Invalid or unavailable voucher.',
          itemsPurchased: 0,
          totalPaid: 0,
          discountsSaved: 0,
          voucherSaved: 0,
        }
      }

      const cartShopId = cartShopIds[0]
      if (cartShopId && voucher.shop_id && voucher.shop_id !== cartShopId) {
        return {
          success: false,
          message: 'This voucher is only valid for the shop that created it.',
          itemsPurchased: 0,
          totalPaid: 0,
          discountsSaved: 0,
          voucherSaved: 0,
        }
      }

      const startMs = new Date(voucher.start_at).getTime()
      const endMs = new Date(voucher.end_at).getTime()
      const nowMs = Date.now()
      if (nowMs < startMs || nowMs > endMs) {
        return {
          success: false,
          message: 'This voucher has expired or is not active yet.',
          itemsPurchased: 0,
          totalPaid: 0,
          discountsSaved: 0,
          voucherSaved: 0,
        }
      }

      if (voucher.usage_limit && (voucher.used_count ?? 0) >= voucher.usage_limit) {
        return {
          success: false,
          message: 'This voucher has reached its usage limit.',
          itemsPurchased: 0,
          totalPaid: 0,
          discountsSaved: 0,
          voucherSaved: 0,
        }
      }

      const voucherType = (() => {
        const metadata =
          voucher && typeof voucher.metadata === 'object' && voucher.metadata !== null
            ? (voucher.metadata as Record<string, unknown>)
            : {}
        const raw =
          (voucher.voucher_type as string | null) ??
          (metadata.voucher_type as string | undefined) ??
          (metadata.voucherType as string | undefined) ??
          (metadata.voucher_category as string | undefined) ??
          ''
        return typeof raw === 'string' ? raw.trim().toLowerCase() : ''
      })()

      const isProductVoucher = voucherType === 'product'
      const linkedProducts = (voucher.voucher_products ?? [])
        .map((row: { product_id?: string | null }) => row.product_id)
        .filter((value: string | null | undefined): value is string => Boolean(value && value.trim()))

      const eligibleSubtotal = isProductVoucher
        ? items.reduce(
            (sum, item) =>
              linkedProducts.includes(item.productId) ? sum + item.price * item.quantity : sum,
            0,
          )
        : items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      if (isProductVoucher) {
        if (linkedProducts.length === 0 || eligibleSubtotal <= 0) {
          return {
            success: false,
            message: 'This voucher only applies to selected products.',
            itemsPurchased: 0,
            totalPaid: 0,
            discountsSaved: 0,
            voucherSaved: 0,
          }
        }
      }

      const minSpend = voucher.min_spend ?? 0
      if (eligibleSubtotal < minSpend) {
        return {
          success: false,
          message: `Minimum spend of ₱${minSpend.toFixed(2)} required.`,
          itemsPurchased: 0,
          totalPaid: 0,
          discountsSaved: 0,
          voucherSaved: 0,
        }
      }

      if (voucher.discount_type === 'percentage') {
        resolvedVoucherDiscount = eligibleSubtotal * (voucher.discount_value / 100)
        if (voucher.max_discount && resolvedVoucherDiscount > voucher.max_discount) {
          resolvedVoucherDiscount = voucher.max_discount
        }
      } else {
        resolvedVoucherDiscount = voucher.discount_value
      }

      resolvedVoucherDiscount = Math.min(resolvedVoucherDiscount, eligibleSubtotal)
      resolvedVoucherId = voucher.id
    }

    let totalPaid = 0
    let discountsSaved = 0

    for (const item of items) {
      const itemTotal = item.price * item.quantity
      const originalTotal = item.originalPrice * item.quantity
      totalPaid += itemTotal
      discountsSaved += originalTotal - itemTotal
    }

    // Apply voucher discount after recomputing totals
    if (resolvedVoucherId && resolvedVoucherDiscount > 0) {
      totalPaid = Math.max(totalPaid - resolvedVoucherDiscount, 0)
    }

    // Reduce stock atomically via RPC
    const stockPayload = Array.from(productQtyMap.entries()).map(([productId, quantity]) => ({
      product_id: productId,
      quantity,
    }))
    const { error: stockError } = await supabase.rpc('decrement_product_stock', {
      p_items: stockPayload,
    })

    if (stockError) {
      const message = stockError.message?.toLowerCase() ?? ''
      return {
        success: false,
        message: message.includes('insufficient stock')
          ? 'Insufficient stock for one or more items in your cart.'
          : 'Unable to complete checkout due to a stock update error.',
        itemsPurchased: 0,
        totalPaid: 0,
        discountsSaved: 0,
        voucherSaved: 0,
      }
    }

    // Update flash deal sold_quantity
    const flashDealQtyMap = new Map<string, number>()
    for (const item of items) {
      if (item.flashDealId) {
        flashDealQtyMap.set(
          item.flashDealId,
          (flashDealQtyMap.get(item.flashDealId) ?? 0) + item.quantity,
        )
      }
    }

    for (const [flashDealId, qty] of flashDealQtyMap) {
      const { data: fd } = await supabase
        .from('flash_deals')
        .select('sold_quantity')
        .eq('id', flashDealId)
        .single()

      if (fd) {
        await supabase
          .from('flash_deals')
          .update({
            sold_quantity: (fd.sold_quantity ?? 0) + qty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', flashDealId)
      }
    }

    // Update product discount used_count
    const discountQtyMap = new Map<string, number>()
    for (const item of items) {
      if (item.discountId) {
        discountQtyMap.set(
          item.discountId,
          (discountQtyMap.get(item.discountId) ?? 0) + item.quantity,
        )
      }
    }

    for (const [discountId, qty] of discountQtyMap) {
      const { data: disc } = await supabase
        .from('product_discounts')
        .select('used_count')
        .eq('id', discountId)
        .single()

      if (disc) {
        await supabase
          .from('product_discounts')
          .update({
            used_count: (disc.used_count ?? 0) + qty,
            updated_at: new Date().toISOString(),
          })
          .eq('id', discountId)
      }
    }

    // Update voucher usage + sales tracking
    if (resolvedVoucherId && resolvedVoucherDiscount > 0) {
      const { data: voucher } = await supabase
        .from('vouchers')
        .select('used_count,total_used,metadata')
        .eq('id', resolvedVoucherId)
        .single()

      if (voucher) {
        const metadata =
          voucher.metadata && typeof voucher.metadata === 'object'
            ? (voucher.metadata as Record<string, unknown>)
            : {}
        const currentSales = Number(metadata.total_sales ?? 0) || 0
        const currentDiscount = Number(metadata.total_discount ?? 0) || 0
        const nextMetadata = {
          ...metadata,
          total_sales: currentSales + totalPaid,
          total_discount: currentDiscount + resolvedVoucherDiscount,
        }

        await supabase
          .from('vouchers')
          .update({
            used_count: (voucher.used_count ?? 0) + 1,
            total_used: (voucher.total_used ?? 0) + 1,
            metadata: nextMetadata,
            updated_at: new Date().toISOString(),
          })
          .eq('id', resolvedVoucherId)
      }

      // Insert voucher_usage record (user_id optional for demo)
      await supabase.from('voucher_usages').insert({
        voucher_id: resolvedVoucherId,
        user_id: '00000000-0000-0000-0000-000000000000', // demo placeholder UUID
        used_at: new Date().toISOString(),
      })
    }

    const itemsPurchased = items.reduce((sum, item) => sum + item.quantity, 0)

    return {
      success: true,
      message: 'Demo purchase completed successfully!',
      itemsPurchased,
      totalPaid,
      discountsSaved,
      voucherSaved: resolvedVoucherDiscount || voucherDiscount,
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
    const flashReset = supabase
      .from('flash_deals')
      .update({ sold_quantity: 0, updated_at: new Date().toISOString() })
    isDemoShop(shopId) ? await flashReset : await flashReset.eq('shop_id', shopId)

    // Reset voucher usage
    const voucherReset = supabase
      .from('vouchers')
      .update({
        used_count: 0,
        total_used: 0,
        updated_at: new Date().toISOString(),
      })
    isDemoShop(shopId) ? await voucherReset : await voucherReset.eq('shop_id', shopId)

    // Reset product discounts used_count
    const discountReset = supabase
      .from('product_discounts')
      .update({ used_count: 0, updated_at: new Date().toISOString() })
    isDemoShop(shopId) ? await discountReset : await discountReset.eq('shop_id', shopId)

    // Reset bundle and addon used_count
    const bundleReset = supabase
      .from('bundles')
      .update({ used_count: 0, updated_at: new Date().toISOString() })
    isDemoShop(shopId) ? await bundleReset : await bundleReset.eq('shop_id', shopId)

    const addonReset = supabase
      .from('addon_deals')
      .update({ used_count: 0, updated_at: new Date().toISOString() })
    isDemoShop(shopId) ? await addonReset : await addonReset.eq('shop_id', shopId)

    // Reset product quantities from metadata snapshots (if present)
    const productsQuery = supabase
      .from('products')
      .select('product_id,quantity,metadata,shop_id')
    const { data: products } = isDemoShop(shopId)
      ? await productsQuery
      : await productsQuery.eq('shop_id', shopId)

    if (products && products.length > 0) {
      for (const product of products) {
        const metadata =
          product && typeof product.metadata === 'object' && product.metadata !== null
            ? (product.metadata as Record<string, unknown>)
            : {}
        const snapshotCandidates = [
          metadata.demo_default_quantity,
          metadata.demoDefaultQuantity,
          metadata.default_quantity,
          metadata.defaultQuantity,
          metadata.original_quantity,
          metadata.originalQuantity,
        ]
        const snapshot = snapshotCandidates.find((value) => typeof value === 'number')
        if (typeof snapshot === 'number') {
          await supabase
            .from('products')
            .update({
              quantity: Math.max(snapshot, 0),
              updated_at: new Date().toISOString(),
            })
            .eq('product_id', product.product_id)
        }
      }
    }

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



