import { z } from "zod";
import type { Order, OrderPage } from "../types";

/** The backend sent an order history the page cannot use. */
export class OrderMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderMappingError";
  }
}

const id = z.union([z.string(), z.number()]).transform(String);
const amount = z.number().int();

const orderSchema = z.object({
  id,
  code: z.string().min(1),
  status: z.enum(["AWAITING_PAYMENT", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"]),
  createdAt: z.string(),
  paidAt: z.string().nullable(),
  address: z.object({
    label: z.string(),
    street: z.string(),
    recipientName: z.string(),
    phone: z.string(),
    subDistrict: z.string(),
    district: z.string(),
    city: z.string(),
    province: z.string(),
  }),
  shipping: z.object({ label: z.string(), price: amount, shipmentCount: amount }),
  paymentMethod: z.string(),
  voucherCode: z.string().nullable(),
  summary: z.object({
    productSubtotal: amount,
    shippingSubtotal: amount,
    buyerServiceFee: amount,
    handlingFee: amount,
    damageProtectionFee: amount,
    discount: amount,
    total: amount,
  }),
  items: z.array(
    z.object({
      id,
      productSlug: z.string().nullable(),
      productName: z.string(),
      variantLabel: z.string(),
      unit: z.string(),
      price: amount,
      quantity: amount,
      lineTotal: amount,
      imageUrl: z.string(),
      shopName: z.string(),
      shopSlug: z.string().nullable(),
    }),
  ),
});

const orderPageSchema = z.object({
  orders: z.array(orderSchema),
  pagination: z.object({ page: amount, limit: amount, total: amount, totalPages: amount }),
});

/** A photo is shown only from an http(s) URL or a path on our own site. */
function safeImageUrl(value: string): string {
  const url = value.trim();
  return /^https?:\/\//i.test(url) || (url.startsWith("/") && !url.startsWith("//")) ? url : "";
}

/** GET /orders. Throws OrderMappingError for a wrong shape. */
export function parseOrderPage(data: unknown): OrderPage {
  const result = orderPageSchema.safeParse(data);
  if (!result.success) throw new OrderMappingError("Unexpected order list response shape.");
  return {
    orders: result.data.orders.map(
      (order): Order => ({ ...order, items: order.items.map((item) => ({ ...item, imageUrl: safeImageUrl(item.imageUrl) })) }),
    ),
    pagination: result.data.pagination,
  };
}

/** The order's lines grouped by shop, in the order they first appear. */
export function groupByShop(order: Order): { shopName: string; shopSlug: string | null; items: Order["items"] }[] {
  const groups = new Map<string, { shopName: string; shopSlug: string | null; items: Order["items"] }>();
  for (const item of order.items) {
    const key = item.shopSlug ?? `name:${item.shopName}`;
    const group = groups.get(key) ?? { shopName: item.shopName, shopSlug: item.shopSlug, items: [] };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()];
}
