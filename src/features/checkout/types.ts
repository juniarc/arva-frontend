import type { Region } from "./schemas/address.schema";

export type { Region };

export interface Address {
  label: string;
  province: Region;
  city: Region;
  district: Region;
  subDistrict: Region;
  street: string;
  recipientName: string;
  phone: string;
}

export interface CheckoutItem {
  /** The cart item id: quantity changes use the cart endpoint with it. */
  id: string;
  quantity: number;
  productId: string;
  productSlug: string;
  name: string;
  imageUrl: string;
  shop: { slug: string; name: string };
  variantLabel: string;
  unit: string;
  /** Current unit price in IDR, from the backend. */
  price: number;
  stock: number;
}

export interface ShippingChoice {
  id: string;
  label: string;
  estimate: string;
  price: number;
}

export interface VoucherChoice {
  id: string;
  title: string;
  code: string;
  discountAmount: number;
}

/** Every amount is calculated by the backend. The client only shows them. */
export interface DraftSummary {
  productSubtotal: number;
  shippingSubtotal: number;
  buyerServiceFee: number;
  handlingFee: number;
  damageProtectionFee: number;
  discount: number;
  total: number;
}

export interface Draft {
  items: CheckoutItem[];
  /** The draft's own copy of the address. Never the profile's. */
  address: Address | null;
  damageProtection: { enabled: boolean; fee: number };
  shipping: ShippingChoice | null;
  voucher: VoucherChoice | null;
  paymentMethod: { id: string; label: string } | null;
  summary: DraftSummary;
}

export type ShippingOption = ShippingChoice;

export interface Voucher {
  id: string;
  title: string;
  description: string;
  code: string;
  discountAmount: number;
}

export interface PaymentMethod {
  id: string;
  label: string;
  available: boolean;
}

export interface Order {
  id: string;
  code: string;
}

export interface ShopGroup {
  shop: { slug: string; name: string };
  items: CheckoutItem[];
}
