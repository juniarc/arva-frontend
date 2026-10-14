import { Package, Store } from "lucide-react";
import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatCurrency } from "@/lib/format";
import { groupByShop } from "../mappers/order.mapper";
import type { Order, OrderStatus } from "../types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "bg-sand text-ink",
  PAID: "bg-mint text-brand",
  SHIPPED: "bg-mint text-brand",
  COMPLETED: "bg-surface text-ink",
  CANCELLED: "bg-danger-soft text-danger-strong",
};

/** "14 Oct 2026, 16:36", in Jakarta time, the same on the server and in the browser. */
export function formatOrderDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(iso));
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-line/30 pt-2 font-bold text-ink" : "text-muted"}`}>
      <dt>{label}</dt>
      <dd className={strong ? "" : "text-ink"}>{value}</dd>
    </div>
  );
}

/** One order: its code, date and status, the lines grouped by shop, and the details. */
export function OrderCard({ order }: { order: Order }) {
  const { address, shipping, summary } = order;
  const headingId = `order-${order.id}`;

  return (
    <article aria-labelledby={headingId} className="rounded-md border border-line/30 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line/30 px-4 py-3">
        <div>
          <h2 id={headingId} className="text-sm font-bold text-ink">
            #{order.code}
          </h2>
          <p className="text-xs text-muted">
            <time dateTime={order.createdAt}>{formatOrderDate(order.createdAt)}</time>
          </p>
        </div>
        <p className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[order.status]}`}>
          <span className="sr-only">Status: </span>
          {STATUS_LABELS[order.status]}
        </p>
      </header>

      <div className="divide-y divide-line/20 px-4">
        {groupByShop(order).map((group) => (
          <section key={group.shopSlug ?? group.shopName} aria-label={`From ${group.shopName}`} className="py-3">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-ink">
              <Store className="size-3.5" aria-hidden="true" />
              {group.shopSlug ? (
                <Link href={`/shops/${group.shopSlug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-info">
                  {group.shopName}
                </Link>
              ) : (
                group.shopName
              )}
            </p>
            <ul className="space-y-3">
              {group.items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-surface text-muted">
                    {item.imageUrl ? (
                      <SafeImage src={item.imageUrl} alt="" fill sizes="3.5rem" className="object-cover" />
                    ) : (
                      <Package className="size-5" aria-hidden="true" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-xs">
                    <p className="line-clamp-2 font-semibold text-ink">
                      {item.productSlug ? (
                        <Link href={`/products/${item.productSlug}`} className="hover:underline focus-visible:outline-2 focus-visible:outline-info">
                          {item.productName}
                        </Link>
                      ) : (
                        item.productName
                      )}
                    </p>
                    <p className="text-muted">
                      {item.variantLabel} · {item.quantity} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-ink">{formatCurrency(item.lineTotal)}</p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-line/30 px-4 py-3 text-sm">
        <span className="text-muted">Total</span>
        <span className="font-bold text-ink">{formatCurrency(summary.total)}</span>
      </div>

      <details className="group border-t border-line/30 px-4 py-3 text-xs">
        <summary className="flex min-h-11 cursor-pointer items-center font-bold text-brand focus-visible:outline-2 focus-visible:outline-info lg:min-h-0">
          Order details
        </summary>
        <div className="mt-2 grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div>
              <p className="font-bold text-ink">Delivery address</p>
              <p className="text-muted">
                {address.recipientName} · {address.phone}
              </p>
              <p className="text-muted">
                {address.street}, {address.subDistrict}, {address.district}, {address.city}, {address.province}
              </p>
            </div>
            <div>
              <p className="font-bold text-ink">Shipping</p>
              <p className="text-muted">
                {shipping.label}
                {shipping.shipmentCount > 1 ? ` · ${shipping.shipmentCount} packages` : ""}
              </p>
            </div>
            <div>
              <p className="font-bold text-ink">Payment</p>
              <p className="text-muted">
                {order.paymentMethod}
                {order.paidAt ? ` · paid ${formatOrderDate(order.paidAt)}` : ""}
              </p>
            </div>
          </div>
          <dl className="space-y-1">
            <SummaryRow label="Products" value={formatCurrency(summary.productSubtotal)} />
            <SummaryRow label="Shipping" value={formatCurrency(summary.shippingSubtotal)} />
            {summary.damageProtectionFee > 0 && <SummaryRow label="Damage protection" value={formatCurrency(summary.damageProtectionFee)} />}
            {summary.discount > 0 && (
              <SummaryRow
                label={order.voucherCode ? `Voucher ${order.voucherCode}` : "Discount"}
                value={`- ${formatCurrency(summary.discount)}`}
              />
            )}
            <SummaryRow label="Total" value={formatCurrency(summary.total)} strong />
          </dl>
        </div>
      </details>
    </article>
  );
}
