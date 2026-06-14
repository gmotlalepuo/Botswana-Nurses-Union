"use client"

import { useMemo, useState } from "react"
import { PackageCheck, Search, ShoppingCart, Sparkles, Trash2 } from "lucide-react"
import type { MerchandiseProduct } from "@/lib/merchandise-data"
import { discountedPrice } from "@/lib/merchandise-data"

type CartItem = {
  productId: string
  name: string
  price: number
  discountPercent: number
  quantity: number
  color: string
  stockCount: number
}

export function MerchandiseShop({ products, memberId }: { products: MerchandiseProduct[]; memberId: string }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [sort, setSort] = useState("name")
  const [page, setPage] = useState(1)
  const [cart, setCart] = useState<CartItem[]>([])
  const [deliveryMethod, setDeliveryMethod] = useState("delivery")
  const [paymentOption, setPaymentOption] = useState("stripe")
  const [monthlyDeduction, setMonthlyDeduction] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [collectionPoint, setCollectionPoint] = useState("BONU Head Office - Gaborone")
  const pageSize = 6
  const categories = Array.from(new Set(products.map((product) => product.category))).sort()

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return products
      .filter((product) => {
        const text = [product.name, product.description ?? "", product.category, product.colors.join(" ")].join(" ").toLowerCase()
        const matchesQuery = !normalizedQuery || text.includes(normalizedQuery)
        const matchesCategory = category === "all" || product.category === category
        const matchesStock = stockFilter === "all" || (stockFilter === "discounted" ? product.discount_percent > 0 : product.stock_count > 0)
        return matchesQuery && matchesCategory && matchesStock
      })
      .sort((left, right) => {
        if (sort === "price-low") return discountedPrice(left) - discountedPrice(right)
        if (sort === "price-high") return discountedPrice(right) - discountedPrice(left)
        if (sort === "stock") return right.stock_count - left.stock_count
        if (sort === "discount") return right.discount_percent - left.discount_percent
        return left.name.localeCompare(right.name)
      })
  }, [category, products, query, sort, stockFilter])

  const pageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize))
  const visibleProducts = filteredProducts.slice((page - 1) * pageSize, page * pageSize)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * (1 - item.discountPercent / 100) * item.quantity, 0)
  const creditMonths = Number(monthlyDeduction) > 0 ? Math.ceil(cartTotal / Number(monthlyDeduction)) : 0

  function addToCart(product: MerchandiseProduct, color: string) {
    if (product.stock_count < 1) {
      return
    }

    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id && item.color === color)
      if (existing) {
        return current.map((item) => item === existing ? { ...item, quantity: Math.min(item.quantity + 1, item.stockCount) } : item)
      }

      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: Number(product.price),
          discountPercent: Number(product.discount_percent ?? 0),
          quantity: 1,
          color,
          stockCount: Number(product.stock_count),
        },
      ]
    })
  }

  function updateQuantity(index: number, quantity: number) {
    setCart((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.max(1, Math.min(quantity, item.stockCount)) } : item))
  }

  function fillDemoOrder() {
    const product = products.find((item) => item.name.toLowerCase().includes("scrub") && item.stock_count > 0)
      ?? products.find((item) => item.stock_count > 0)

    if (product) {
      setCart([{
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        discountPercent: Number(product.discount_percent ?? 0),
        quantity: Math.min(2, Number(product.stock_count)),
        color: product.colors.includes("Navy") ? "Navy" : (product.colors[0] ?? "Default"),
        stockCount: Number(product.stock_count),
      }])
    }

    setPaymentOption("credit")
    setMonthlyDeduction("180")
    setDeliveryMethod("delivery")
    setDeliveryAddress("Plot 2148, Block 8, Gaborone, Botswana")
  }

  return (
    <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
      <section className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_12rem_12rem_12rem]">
            <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input className="w-full bg-transparent text-sm outline-none" placeholder="Search products, colors, category" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
            </label>
            <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }}>
              <option value="all">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={stockFilter} onChange={(event) => { setStockFilter(event.target.value); setPage(1) }}>
              <option value="all">All stock</option>
              <option value="in-stock">In stock</option>
              <option value="discounted">Discounted</option>
            </select>
            <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="name">Sort by name</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="stock">Stock count</option>
              <option value="discount">Discount</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visibleProducts.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addToCart} />
          ))}
          {visibleProducts.length === 0 ? <p className="rounded-lg border bg-white p-5 text-sm text-muted-foreground">No products match your filters.</p> : null}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-lg border bg-white p-3">
          <p className="text-sm text-muted-foreground">Page {page} of {pageCount}</p>
          <div className="flex gap-2">
            <button className="rounded-md border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <button className="rounded-md border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
          </div>
        </div>
      </section>

      <aside className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold">Cart</h2>
        </div>
        <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-sm font-bold text-primary">AI Mimic</p>
          <p className="mt-1 text-xs text-muted-foreground">Build a realistic Botswana demonstration order with delivery and monthly deduction details.</p>
          <button
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md border border-primary/30 bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10"
            type="button"
            onClick={fillDemoOrder}
          >
            <Sparkles className="h-4 w-4" />
            Fill demo order
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {cart.map((item, index) => (
            <div key={`${item.productId}-${item.color}`} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-bold">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.color} - P{discountedPrice({ price: item.price, discount_percent: item.discountPercent }).toFixed(2)}</p>
                </div>
                <button aria-label="Remove item" className="rounded-md p-1 hover:bg-muted" onClick={() => setCart((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <input className="mt-3 w-full rounded-md border px-3 py-2" min={1} max={item.stockCount} type="number" value={item.quantity} onChange={(event) => updateQuantity(index, Number(event.target.value))} />
            </div>
          ))}
          {cart.length === 0 ? <p className="rounded-md bg-muted/40 p-3 text-sm text-muted-foreground">Add products to start checkout.</p> : null}
        </div>
        <div className="mt-4 rounded-md bg-muted p-3 text-right">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">P{cartTotal.toFixed(2)}</p>
        </div>

        <form action="/api/payments/create-checkout" method="post" className="mt-4 space-y-3">
          <input type="hidden" name="checkoutType" value="merchandise" />
          <input type="hidden" name="memberId" value={memberId} />
          <input type="hidden" name="cart" value={JSON.stringify(cart)} />
          <label className="block">
            <span className="text-sm font-semibold">Payment option</span>
            <select className="mt-2 w-full rounded-md border bg-white px-3 py-2" name="paymentOption" value={paymentOption} onChange={(event) => setPaymentOption(event.target.value)}>
              <option value="stripe">Pay now with Stripe</option>
              <option value="credit">Credit purchase</option>
            </select>
          </label>
          {paymentOption === "credit" ? (
            <label className="block">
              <span className="text-sm font-semibold">Monthly deduction</span>
              <input className="mt-2 w-full rounded-md border px-3 py-2" min={1} name="monthlyDeduction" required type="number" value={monthlyDeduction} onChange={(event) => setMonthlyDeduction(event.target.value)} />
              {creditMonths > 0 ? <span className="mt-1 block text-xs text-muted-foreground">Estimated repayment period: {creditMonths} months</span> : null}
            </label>
          ) : null}
          <label className="block">
            <span className="text-sm font-semibold">Fulfilment</span>
            <select className="mt-2 w-full rounded-md border bg-white px-3 py-2" name="deliveryMethod" value={deliveryMethod} onChange={(event) => setDeliveryMethod(event.target.value)}>
              <option value="delivery">Deliver to address</option>
              <option value="collection">Collect at collection point</option>
            </select>
          </label>
          {deliveryMethod === "delivery" ? (
            <label className="block">
              <span className="text-sm font-semibold">Delivery address</span>
              <textarea className="mt-2 min-h-24 w-full rounded-md border px-3 py-2" name="deliveryAddress" required value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} />
            </label>
          ) : (
            <label className="block">
              <span className="text-sm font-semibold">Collection point</span>
              <select className="mt-2 w-full rounded-md border bg-white px-3 py-2" name="collectionPoint" value={collectionPoint} onChange={(event) => setCollectionPoint(event.target.value)}>
                <option>BONU Head Office - Gaborone</option>
                <option>Francistown regional office</option>
                <option>Maun regional collection desk</option>
              </select>
            </label>
          )}
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50" disabled={cart.length === 0}>
            <PackageCheck className="h-4 w-4" />
            {paymentOption === "credit" ? "Place credit order" : "Checkout with Stripe"}
          </button>
        </form>
      </aside>
    </div>
  )
}

function ProductCard({ product, onAdd }: { product: MerchandiseProduct; onAdd: (product: MerchandiseProduct, color: string) => void }) {
  const [color, setColor] = useState(product.colors[0] ?? "Default")
  const salePrice = discountedPrice(product)
  const hasDiscount = Number(product.discount_percent ?? 0) > 0

  return (
    <article className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-muted">
        <img alt={product.name} className="h-full w-full object-cover" src={product.image_url} />
        {hasDiscount ? <p className="absolute left-3 top-3 rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">{product.discount_percent}% off</p> : null}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-normal text-primary">{product.category}</p>
          <h2 className="mt-1 text-lg font-bold">{product.name}</h2>
          <p className="mt-1 min-h-10 text-sm text-muted-foreground">{product.description}</p>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-bold">P{salePrice.toFixed(2)}</p>
            {hasDiscount ? <p className="text-xs text-muted-foreground line-through">P{Number(product.price).toFixed(2)}</p> : null}
          </div>
          <p className="rounded-md bg-muted px-2 py-1 text-xs font-bold">{product.stock_count} in stock</p>
        </div>
        <label className="block">
          <span className="text-sm font-semibold">Color</span>
          <select className="mt-2 w-full rounded-md border bg-white px-3 py-2" value={color} onChange={(event) => setColor(event.target.value)}>
            {product.colors.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <button className="w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-50" disabled={product.stock_count < 1} onClick={() => onAdd(product, color)}>
          Add to cart
        </button>
      </div>
    </article>
  )
}
