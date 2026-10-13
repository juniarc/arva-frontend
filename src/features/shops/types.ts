import type { Product } from "@/features/products/types";
import type { Region } from "@/features/checkout/types";

export type { Region };

export interface ShippingChannel {
  id: string;
  name: string;
}

export interface ShopAddress {
  street: string;
  zipCode: string;
  province: Region;
  city: Region;
  district: Region;
  subDistrict: Region;
}

/** What only the owner sees. The backend sends it to the owner and to nobody else. */
export interface OwnerDetails {
  contact: { email: string; phone: string | null };
  address: ShopAddress | null;
  shippingChannels: ShippingChannel[];
}

export interface Shop {
  slug: string;
  name: string;
  city: string;
  logoUrl: string | null;
  description: string;
  /** "HH:MM", 24-hour. */
  operatingHours: { open: string; close: string };
  rating: { average: number; ratingCount: number };
  /** Active products only. */
  productCount: number;
  /** Decided by the backend from the token. The client never works it out. */
  isOwner: boolean;
  ownerDetails: OwnerDetails | null;
}

/** The owner's extra fields on a product. */
export interface ProductManage {
  isActive: boolean;
  totalStock: number;
  variantLabels: string[];
  ratingCount: number;
}

/** A product on a shop page: the card's `Product`, and the owner's extra fields (null for everyone else). */
export interface ShopProduct {
  product: Product;
  manage: ProductManage | null;
}

/** A product that has the owner's fields: what an owner row needs. */
export type OwnerShopProduct = ShopProduct & { manage: ProductManage };

export interface ShopPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** The owner's own shop, as the edit form needs it (GET and PUT /shops/me). */
export interface MyShop {
  slug: string;
  name: string;
  logoUrl: string | null;
  description: string;
  operatingHours: { open: string; close: string };
  provinceId: string;
  cityId: string;
  districtId: string;
  subDistrictId: string;
  street: string;
  zipCode: string;
  email: string;
  phone: string | null;
  shippingChannelIds: string[];
}
