import { MerchandiseOrderHistory } from "@/components/merchandise-order-history"
import { MerchandiseShop } from "@/components/merchandise-shop"
import { MemberPortalShell } from "@/components/member-portal-shell"
import { getMerchandiseProducts } from "@/lib/merchandise-data"
import { getMemberPortalData } from "@/lib/member-data"
import { requireActiveMemberPage } from "@/lib/member-auth"

export default async function MerchandisePage() {
  const { user } = await requireActiveMemberPage()
  const data = await getMemberPortalData(user.id)
  const products = await getMerchandiseProducts()

  return (
    <MemberPortalShell profile={data.profile}>
      <div className="space-y-5">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h1 className="text-3xl font-bold tracking-normal">Browse and order merchandise</h1>
          <MerchandiseShop products={products} memberId={data.profile?.id ?? user.id} />
        </section>
        <MerchandiseOrderHistory orders={data.merchandiseOrders} />
      </div>
    </MemberPortalShell>
  )
}
