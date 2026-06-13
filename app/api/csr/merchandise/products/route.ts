import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { requireStaffRequest } from "@/lib/admin-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { user, response } = await requireStaffRequest(request)

    if (response) {
      return response
    }

    const formData = await request.formData()
    const actionType = String(formData.get("actionType") ?? "create")
    const productId = String(formData.get("productId") ?? "")
    const name = String(formData.get("name") ?? "").trim()
    const description = String(formData.get("description") ?? "").trim()
    const category = String(formData.get("category") ?? "General").trim()
    const price = Number(formData.get("price") ?? 0)
    const stockCount = Number(formData.get("stockCount") ?? 0)
    const discountPercent = Number(formData.get("discountPercent") ?? 0)
    const existingImageUrl = String(formData.get("existingImageUrl") ?? "").trim()
    const image = formData.get("image")
    const isActive = formData.get("isActive") === "yes"
    const redirectTo = safeCsrRedirect(formData.get("redirectTo"))
    const colors = String(formData.get("colors") ?? "")
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean)

    if (!name || !Number.isFinite(price) || price <= 0 || !Number.isFinite(stockCount) || (actionType === "update" && !productId)) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const admin = createAdminClient()
    let uploadedImageUrl: string | null = null
    try {
      uploadedImageUrl = image instanceof File && image.size > 0 ? await uploadMerchandiseImage(admin, image) : null
    } catch (error) {
      console.error("Merchandise image upload failed", error)
      return NextResponse.redirect(new URL(`${redirectTo}?error=document-upload`, request.url), 303)
    }
    const imageUrl = uploadedImageUrl ?? existingImageUrl

    if (!imageUrl) {
      return NextResponse.redirect(new URL(`${redirectTo}?error=missing`, request.url), 303)
    }

    const payload = {
      name,
      description: description || null,
      category: category || "General",
      price,
      stock_count: Math.max(0, Math.floor(stockCount)),
      discount_percent: Math.max(0, Math.min(discountPercent || 0, 100)),
      colors: colors.length > 0 ? colors : ["Default"],
      image_url: imageUrl,
      is_active: isActive,
      created_by: user?.id,
      updated_at: new Date().toISOString(),
    }
    const result = actionType === "update"
      ? await admin.from("merchandise_products").update(payload).eq("id", productId)
      : await admin.from("merchandise_products").insert(payload)

    if (result.error) {
      console.error("Merchandise product save failed", result.error)
      return NextResponse.redirect(new URL(`${redirectTo}?error=application-submit`, request.url), 303)
    }

    return NextResponse.redirect(new URL(`${redirectTo}?success=${actionType === "update" ? "product-updated" : "product-created"}`, request.url), 303)
  } catch (error) {
    console.error("Merchandise product submit failed", error)
    return NextResponse.redirect(new URL("/csr?error=not-configured#merchandise", request.url), 303)
  }
}

async function uploadMerchandiseImage(admin: ReturnType<typeof createAdminClient>, image: File) {
  const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])
  if (!allowedTypes.has(image.type) || image.size > 8 * 1024 * 1024) {
    throw new Error("Invalid merchandise image.")
  }

  const extension = image.name.includes(".") ? image.name.split(".").pop() : "jpg"
  const filePath = `products/${randomUUID()}.${extension}`
  const bucket = process.env.SUPABASE_MERCHANDISE_IMAGES_BUCKET || "merchandise-images"
  const { data: existingBucket } = await admin.storage.getBucket(bucket)
  if (!existingBucket) {
    const { error: bucketError } = await admin.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: 8 * 1024 * 1024,
      allowedMimeTypes: Array.from(allowedTypes),
    })
    if (bucketError) throw bucketError
  }
  const { error } = await admin.storage.from(bucket).upload(filePath, image, {
    contentType: image.type,
    upsert: false,
  })

  if (error) {
    throw error
  }

  return admin.storage.from(bucket).getPublicUrl(filePath).data.publicUrl
}

function safeCsrRedirect(value: FormDataEntryValue | null) {
  const path = String(value ?? "/csr")
  return path.startsWith("/csr") ? path : "/csr"
}
