import { createAdminClient } from "@/lib/supabase/admin"

export type MerchandiseProduct = {
  id: string
  name: string
  description: string | null
  category: string
  price: number
  stock_count: number
  discount_percent: number
  colors: string[]
  image_url: string
  is_active: boolean
  created_at?: string
}

export const seededMerchandiseProducts: MerchandiseProduct[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    name: "Nursing uniform dress",
    description: "Professional white nursing uniform dress for clinical duty.",
    category: "Uniforms",
    price: 420,
    stock_count: 45,
    discount_percent: 10,
    colors: ["White", "Navy trim"],
    image_url: "https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=900&q=80",
    is_active: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    name: "BONU scrub set",
    description: "Comfortable scrub top and trouser set for daily workwear.",
    category: "Uniforms",
    price: 360,
    stock_count: 60,
    discount_percent: 0,
    colors: ["Teal", "Navy", "Grey"],
    image_url: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80",
    is_active: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    name: "BONU branded polo",
    description: "Union-branded polo shirt for events, campaigns, and casual wear.",
    category: "Clothing",
    price: 180,
    stock_count: 80,
    discount_percent: 15,
    colors: ["Cyan", "White", "Black"],
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    is_active: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000104",
    name: "BONU tote bag",
    description: "Durable everyday tote bag for documents and essentials.",
    category: "Bags",
    price: 120,
    stock_count: 35,
    discount_percent: 0,
    colors: ["Black", "Natural", "Blue"],
    image_url: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=900&q=80",
    is_active: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000105",
    name: "BONU lanyard",
    description: "Branded lanyard with card holder clip.",
    category: "Accessories",
    price: 45,
    stock_count: 120,
    discount_percent: 5,
    colors: ["Blue", "White"],
    image_url: "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=900&q=80",
    is_active: true,
  },
  {
    id: "00000000-0000-4000-8000-000000000106",
    name: "BONU water bottle",
    description: "Reusable branded bottle for shifts, meetings, and travel.",
    category: "Accessories",
    price: 95,
    stock_count: 50,
    discount_percent: 0,
    colors: ["Clear", "Blue", "Black"],
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=900&q=80",
    is_active: true,
  },
]

export async function getMerchandiseProducts() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from("merchandise_products")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) {
      return seededMerchandiseProducts
    }

    const rows = (data ?? []) as MerchandiseProduct[]
    return rows.length > 0 ? rows : seededMerchandiseProducts
  } catch {
    return seededMerchandiseProducts
  }
}

export function discountedPrice(product: Pick<MerchandiseProduct, "price" | "discount_percent">) {
  return Number(product.price) * (1 - Number(product.discount_percent ?? 0) / 100)
}
