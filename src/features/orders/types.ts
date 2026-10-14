export type OrderStatus = "AWAITING_PAYMENT" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED";

export interface OrderItem {
  id: string;
  /** Null when the product was deleted or is no longer on sale: the line then has no link. */
  productSlug: string | null;
  productName: string;
  variantLabel: string;
  unit: string;
  /** Integer IDR, the price when the order was placed. */
  price: number;
  quantity: number;
  lineTotal: number;
  /** Empty when the order has no photo for the line. */
  imageUrl: string;
  shopName: string;
  shopSlug: string | null;
}

/** A placed order, as the buyer's order history shows it. Everything is a copy from when it was placed. */
export interface Order {
  id: string;
  code: string;
  status: OrderStatus;
  createdAt: string;
  paidAt: string | null;
  address: {
    label: string;
    street: string;
    recipientName: string;
    phone: string;
    subDistrict: string;
    district: string;
    city: string;
    province: string;
  };
  shipping: { label: string; price: number; shipmentCount: number };
  paymentMethod: string;
  voucherCode: string | null;
  summary: {
    productSubtotal: number;
    shippingSubtotal: number;
    buyerServiceFee: number;
    handlingFee: number;
    damageProtectionFee: number;
    discount: number;
    total: number;
  };
  items: OrderItem[];
}

export interface OrderPage {
  orders: Order[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
