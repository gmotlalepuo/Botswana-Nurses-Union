"use client"

import { useMemo, useState } from "react"
import { Download, ImagePlus, PackagePlus, Pencil, Search, X } from "lucide-react"
import type { MerchandiseProduct } from "@/lib/merchandise-data"
import { discountedPrice } from "@/lib/merchandise-data"

export function CsrMerchandiseCatalog({ products }: { products: MerchandiseProduct[] }) {
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [sortBy, setSortBy] = useState("name")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [editingProduct, setEditingProduct] = useState<MerchandiseProduct | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category))).sort(), [products])

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return products
      .filter((product) => {
        const text = [product.name, product.description ?? "", product.category, product.colors.join(" ")].join(" ").toLowerCase()
        const matchesStock = stockFilter === "all" ||
          (stockFilter === "in-stock" ? product.stock_count > 0 : stockFilter === "discounted" ? product.discount_percent > 0 : product.stock_count === 0)
        return (!normalizedQuery || text.includes(normalizedQuery)) &&
          (category === "all" || product.category === category) &&
          matchesStock
      })
      .sort((left, right) => {
        if (sortBy === "price-low") return discountedPrice(left) - discountedPrice(right)
        if (sortBy === "price-high") return discountedPrice(right) - discountedPrice(left)
        if (sortBy === "stock") return right.stock_count - left.stock_count
        if (sortBy === "discount") return right.discount_percent - left.discount_percent
        return left.name.localeCompare(right.name)
      })
  }, [category, products, query, sortBy, stockFilter])

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleProducts = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function exportCsv() {
    const headers = ["Name", "Description", "Category", "Price", "Stock", "Discount", "Colors", "Active"]
    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((product) => [
        product.name,
        product.description,
        product.category,
        product.price,
        product.stock_count,
        product.discount_percent,
        product.colors.join(", "),
        product.is_active ? "Yes" : "No",
      ].map(escapeCsv).join(",")),
    ].join("\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "csr-merchandise.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section id="merchandise" className="rounded-lg border bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold">Merchandise catalog</h2>
          <p className="mt-1 text-sm text-muted-foreground">Manage the products displayed in the member shop.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm font-semibold hover:bg-muted" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            Export
          </button>
          <button className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground" onClick={() => setShowAddModal(true)}>
            <PackagePlus className="h-4 w-4" />
            Add new merchandise
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-lg border bg-muted/30 p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_12rem_12rem_12rem_10rem]">
          <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input className="w-full bg-transparent text-sm outline-none" placeholder="Search merchandise" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
          </label>
          <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1) }}>
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={stockFilter} onChange={(event) => { setStockFilter(event.target.value); setPage(1) }}>
            <option value="all">All stock</option>
            <option value="in-stock">In stock</option>
            <option value="out-of-stock">Out of stock</option>
            <option value="discounted">Discounted</option>
          </select>
          <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1) }}>
            <option value="name">Sort by name</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="stock">Stock count</option>
            <option value="discount">Discount</option>
          </select>
          <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1) }}>
            <option value={6}>6 per page</option>
            <option value={12}>12 per page</option>
            <option value={24}>24 per page</option>
          </select>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visibleProducts.map((product) => (
          <MerchandiseCard key={product.id} product={product} onEdit={() => setEditingProduct(product)} />
        ))}
        {visibleProducts.length === 0 && <p className="rounded-lg border bg-muted/20 p-5 text-sm text-muted-foreground">No merchandise matches your filters.</p>}
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-lg border bg-white p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground">Showing {rows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, rows.length)} of {rows.length} items</p>
        <div className="flex items-center gap-2">
          <button className="rounded-md border px-3 py-2 font-semibold disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
          <span className="px-2 font-semibold">Page {currentPage} of {pageCount}</span>
          <button className="rounded-md border px-3 py-2 font-semibold disabled:opacity-40" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
        </div>
      </div>

      {showAddModal && <MerchandiseFormModal mode="create" onClose={() => setShowAddModal(false)} />}
      {editingProduct && <MerchandiseFormModal mode="update" product={editingProduct} onClose={() => setEditingProduct(null)} />}
    </section>
  )
}

function MerchandiseCard({ product, onEdit }: { product: MerchandiseProduct; onEdit: () => void }) {
  const salePrice = discountedPrice(product)
  const hasDiscount = Number(product.discount_percent) > 0

  return (
    <article className="overflow-hidden rounded-lg border bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-muted">
        <img alt={product.name} className="h-full w-full object-cover" src={product.image_url} />
        {hasDiscount && <span className="absolute left-3 top-3 rounded-md bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">{product.discount_percent}% off</span>}
        {!product.is_active && <span className="absolute right-3 top-3 rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-white">Inactive</span>}
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase text-primary">{product.category}</p>
          <h3 className="mt-1 text-lg font-bold">{product.name}</h3>
          <p className="mt-1 min-h-10 text-sm text-muted-foreground">{product.description || "No description provided."}</p>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xl font-bold">P{salePrice.toFixed(2)}</p>
            {hasDiscount && <p className="text-xs text-muted-foreground line-through">P{Number(product.price).toFixed(2)}</p>}
          </div>
          <p className="rounded-md bg-muted px-2 py-1 text-xs font-bold">{product.stock_count} in stock</p>
        </div>
        <p className="text-sm text-muted-foreground">Colors: {product.colors.join(", ") || "Default"}</p>
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-md border bg-white px-4 py-3 font-semibold text-primary hover:bg-muted" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          Edit merchandise
        </button>
      </div>
    </article>
  )
}

function MerchandiseFormModal({ mode, product, onClose }: { mode: "create" | "update"; product?: MerchandiseProduct; onClose: () => void }) {
  const [preview, setPreview] = useState(product?.image_url ?? "")
  const formId = `merchandise-${mode}-${product?.id ?? "new"}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6" role="dialog" aria-modal="true" aria-labelledby={`${formId}-title`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white/95 px-5 py-5 backdrop-blur sm:px-7">
          <div>
            <h3 id={`${formId}-title`} className="text-xl font-bold">{mode === "create" ? "Add new merchandise" : `Edit ${product?.name}`}</h3>
            <p className="mt-1 text-sm text-muted-foreground">Complete the product information shown in the member shop.</p>
          </div>
          <button className="rounded-full border p-2.5 text-muted-foreground hover:bg-muted" onClick={onClose} aria-label="Close merchandise form">
            <X className="h-4 w-4" />
          </button>
        </header>

        <form id={formId} action="/api/csr/merchandise/products" method="post" encType="multipart/form-data" className="grid gap-5 p-5 sm:grid-cols-2 sm:p-7">
          <input type="hidden" name="actionType" value={mode} />
          <input type="hidden" name="productId" value={product?.id ?? ""} />
          <input type="hidden" name="existingImageUrl" value={product?.image_url ?? ""} />
          <input type="hidden" name="redirectTo" value="/csr/products" />

          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Product image</span>
            <div className="mt-2 grid gap-4 rounded-xl border border-dashed bg-muted/20 p-4 sm:grid-cols-[180px_1fr] sm:items-center">
              <div className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                {preview ? <img alt="Product preview" className="h-full w-full object-cover" src={preview} /> : <div className="flex h-full items-center justify-center"><ImagePlus className="h-8 w-8 text-muted-foreground" /></div>}
              </div>
              <div>
                <input
                  className="block w-full text-sm"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  name="image"
                  required={mode === "create"}
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) setPreview(URL.createObjectURL(file))
                  }}
                />
                <p className="mt-2 text-xs text-muted-foreground">Choose a JPG, PNG, WEBP, or GIF image from this computer.</p>
              </div>
            </div>
          </label>

          <ModalField name="name" label="Product name" defaultValue={product?.name} required />
          <ModalField name="category" label="Category" defaultValue={product?.category} required />
          <ModalField name="price" label="Price (BWP)" defaultValue={product?.price} type="number" step="0.01" required />
          <ModalField name="stockCount" label="Count in stock" defaultValue={product?.stock_count} type="number" required />
          <ModalField name="discountPercent" label="Discount %" defaultValue={product?.discount_percent} type="number" step="0.01" />
          <ModalField name="colors" label="Colors available" defaultValue={product?.colors.join(", ")} placeholder="Blue, White, Black" />
          <label className="block sm:col-span-2">
            <span className="text-sm font-semibold">Description</span>
            <textarea className="mt-2 min-h-28 w-full rounded-md border px-3 py-2 outline-none" name="description" defaultValue={product?.description ?? ""} />
          </label>
          <label className="flex items-center gap-3 rounded-md border p-3 sm:col-span-2">
            <input name="isActive" type="checkbox" value="yes" defaultChecked={product?.is_active ?? true} />
            <span>
              <span className="block text-sm font-semibold">Active in member shop</span>
              <span className="block text-xs text-muted-foreground">Inactive merchandise is hidden from customers.</span>
            </span>
          </label>
        </form>

        <footer className="sticky bottom-0 flex justify-end gap-2 border-t bg-white/95 px-5 py-4 backdrop-blur sm:px-7">
          <button className="rounded-md border bg-white px-4 py-2.5 text-sm font-semibold hover:bg-muted" onClick={onClose}>Cancel</button>
          <button form={formId} className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
            {mode === "create" ? "Add merchandise" : "Save changes"}
          </button>
        </footer>
      </div>
    </div>
  )
}

function ModalField({ name, label, type = "text", defaultValue, required = false, placeholder, step }: { name: string; label: string; type?: string; defaultValue?: string | number; required?: boolean; placeholder?: string; step?: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input className="mt-2 w-full rounded-md border px-3 py-2 outline-none" name={name} type={type} defaultValue={defaultValue} required={required} placeholder={placeholder} step={step} />
    </label>
  )
}

function escapeCsv(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`
}
