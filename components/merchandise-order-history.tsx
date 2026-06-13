"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"
import type { MemberMerchandiseOrder } from "@/lib/member-data"
import { formatCurrency } from "@/lib/member-data"
import { StatusBadge } from "@/components/status-badge"

export function MerchandiseOrderHistory({ orders }: { orders: MemberMerchandiseOrder[] }) {
  const [query, setQuery] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [fulfilmentFilter, setFulfilmentFilter] = useState("all")
  const [sort, setSort] = useState("newest")
  const [page, setPage] = useState(1)
  const pageSize = 8
  const visibleOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return orders
      .filter((order) => {
        const productText = (order.merchandise_order_items ?? []).map((item) => `${item.product_name} ${item.color ?? ""}`).join(" ")
        const text = [
          order.order_number,
          productText,
          order.payment_option,
          order.payment_status,
          order.delivery_method,
          order.delivery_address ?? "",
          order.collection_point ?? "",
          order.fulfilment_status,
        ].join(" ").toLowerCase()
        const matchesQuery = !normalizedQuery || text.includes(normalizedQuery)
        const matchesPayment = paymentFilter === "all" || order.payment_option === paymentFilter || order.payment_status === paymentFilter
        const signedOff = Boolean(order.customer_signed_off_at)
        const matchesFulfilment =
          fulfilmentFilter === "all" ||
          (fulfilmentFilter === "signed-off" ? signedOff : !signedOff && order.delivery_method === fulfilmentFilter)

        return matchesQuery && matchesPayment && matchesFulfilment
      })
      .sort((left, right) => {
        if (sort === "oldest") return new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
        if (sort === "total-high") return Number(right.total_amount ?? 0) - Number(left.total_amount ?? 0)
        if (sort === "total-low") return Number(left.total_amount ?? 0) - Number(right.total_amount ?? 0)
        if (sort === "balance-high") return Number(right.balance_remaining ?? 0) - Number(left.balance_remaining ?? 0)
        if (sort === "order") return left.order_number.localeCompare(right.order_number)
        return new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      })
  }, [fulfilmentFilter, orders, paymentFilter, query, sort])
  const pageCount = Math.max(1, Math.ceil(visibleOrders.length / pageSize))
  const pagedOrders = visibleOrders.slice((page - 1) * pageSize, page * pageSize)

  return (
    <section className="rounded-lg border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">Order history and deliveries</h2>
      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_12rem_12rem_12rem]">
        <label className="flex items-center gap-2 rounded-md border bg-white px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input className="w-full bg-transparent text-sm outline-none" placeholder="Search orders, products, address" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} />
        </label>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={paymentFilter} onChange={(event) => { setPaymentFilter(event.target.value); setPage(1) }}>
          <option value="all">All payments</option>
          <option value="cash">Cash</option>
          <option value="credit">Credit</option>
          <option value="paid">Paid</option>
          <option value="credit_active">Credit active</option>
        </select>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={fulfilmentFilter} onChange={(event) => { setFulfilmentFilter(event.target.value); setPage(1) }}>
          <option value="all">All fulfilment</option>
          <option value="delivery">Delivery</option>
          <option value="collection">Collection</option>
          <option value="signed-off">Signed off</option>
        </select>
        <select className="rounded-md border bg-white px-3 py-2 text-sm font-medium" value={sort} onChange={(event) => setSort(event.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="total-high">Total high to low</option>
          <option value="total-low">Total low to high</option>
          <option value="balance-high">Balance high to low</option>
          <option value="order">Order number</option>
        </select>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Balance left</th>
              <th className="px-4 py-3">Monthly deduction</th>
              <th className="px-4 py-3">Order details</th>
              <th className="px-4 py-3">Customer sign-off</th>
            </tr>
          </thead>
          <tbody>
            {pagedOrders.map((order) => (
              <tr key={order.id} className="border-t align-top">
                <td className="px-4 py-3">
                  <p className="font-bold">{order.order_number}</p>
                  <div className="mt-1"><StatusBadge status={formatOrderStatus(order)} /></div>
                </td>
                <td className="px-4 py-3">
                  {(order.merchandise_order_items ?? []).map((item) => (
                    <p key={item.id}>{item.product_name} x {item.quantity}{item.color ? ` (${item.color})` : ""}</p>
                  ))}
                </td>
                <td className="px-4 py-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">{formatPaymentOption(order.payment_option)}</p>
                  <StatusBadge status={formatPaymentStatus(order.payment_status, order.payment_option)} />
                </td>
                <td className="px-4 py-3">{formatCurrency(Number(order.total_amount ?? 0))}</td>
                <td className="px-4 py-3">{formatCurrency(Number(order.balance_remaining ?? 0))}</td>
                <td className="px-4 py-3">{order.monthly_deduction ? formatCurrency(Number(order.monthly_deduction)) : "N/A"}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold">{order.delivery_method === "delivery" ? "Delivery" : "Collection"}</p>
                  <p className="mt-1 text-muted-foreground">{order.delivery_method === "delivery" ? order.delivery_address : order.collection_point}</p>
                  <div className="mt-2"><StatusBadge status={formatFulfilmentStatus(order)} /></div>
                </td>
                <td className="px-4 py-3">
                  {order.customer_signed_off_at ? (
                    <div>
                      <p className="font-semibold text-success">Signed off</p>
                      <p className="mt-1 text-xs text-muted-foreground">{new Date(order.customer_signed_off_at).toLocaleString()}</p>
                    </div>
                  ) : (
                    <form action="/api/member/merchandise/orders/signoff" method="post">
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground">
                        {order.delivery_method === "delivery" ? "Confirm delivered" : "Confirm collected"}
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {pagedOrders.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={8}>No merchandise orders found.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border bg-white p-3">
        <p className="text-sm text-muted-foreground">Page {page} of {pageCount} · {visibleOrders.length} orders</p>
        <div className="flex gap-2">
          <button className="rounded-md border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
          <button className="rounded-md border bg-white px-3 py-2 text-sm font-semibold disabled:opacity-40" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next</button>
        </div>
      </div>
    </section>
  )
}

function formatFulfilmentStatus(order: MemberMerchandiseOrder) {
  if (order.customer_signed_off_at) {
    return order.delivery_method === "delivery" ? "Delivered and confirmed" : "Collected and confirmed"
  }

  if (order.fulfilment_status && order.fulfilment_status !== "pending") {
    return order.fulfilment_status.replace(/_/g, " ")
  }

  return order.delivery_method === "delivery" ? "Awaiting delivery confirmation" : "Awaiting collection confirmation"
}

function formatPaymentOption(value: string) {
  return value === "credit" ? "Credit" : "Cash"
}

function formatPaymentStatus(status: string, option: string) {
  if (option !== "credit" && (status === "paid" || status === "pending")) {
    return status === "paid" ? "Paid" : "Awaiting payment"
  }

  if (option === "credit" && status === "credit_active") {
    return "Active"
  }

  return status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function formatOrderStatus(order: MemberMerchandiseOrder) {
  if (order.payment_option !== "credit" && order.payment_status === "paid") {
    return "Payment successful"
  }

  if (order.payment_option === "credit" && Number(order.balance_remaining ?? 0) > 0) {
    return "Credit active"
  }

  if (order.payment_status === "paid") {
    return "Paid in full"
  }

  return order.status.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}
