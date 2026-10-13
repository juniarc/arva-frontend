import { parseMyShop, parseShop } from "./mappers/shop.mapper";
import { parseShopProducts } from "./mappers/shop-product.mapper";
import type { MyShop, Shop } from "./types";

/** What the backend sends for a guest or a non-owner. */
export const shopDto = (overrides: Record<string, unknown> = {}) => ({
  slug: "bali-fresh-farm",
  name: "Bali Fresh Farm",
  city: "Jakarta",
  logoUrl: null,
  description: "Fresh bananas straight from local farmers.",
  operatingHours: { open: "09:00", close: "19:00" },
  rating: { average: 3.4, ratingCount: 10 },
  productCount: 2,
  isOwner: false,
  ownerDetails: null,
  ...overrides,
});

export const ownerDetailsDto = () => ({
  contact: { email: "shop@example.com", phone: "+6281234567890" },
  address: {
    street: "Jl. Kebon Sirih No. 1",
    zipCode: "10270",
    province: { id: "31", name: "DKI Jakarta" },
    city: { id: "31.71", name: "Jakarta Pusat" },
    district: { id: "31.71.07", name: "Tanah Abang" },
    subDistrict: { id: "31.71.07.1001", name: "Gelora" },
  },
  shippingChannels: [
    { id: "1", name: "JNE" },
    { id: "2", name: "J&T" },
  ],
});

export const ownerShopDto = () => shopDto({ isOwner: true, ownerDetails: ownerDetailsDto() });

export const productItemDto = (overrides: Record<string, unknown> = {}) => ({
  id: "10",
  slug: "banana-bali",
  name: "Banana Fruits from Bali",
  imageUrl: "https://cdn.test/banana.jpg",
  categoryName: "Fruit",
  price: 1000,
  originalPrice: null,
  discountPercent: null,
  rating: 3.4,
  soldCount: 30,
  city: "Jakarta",
  shop: { slug: "bali-fresh-farm", name: "Bali Fresh Farm" },
  manage: null,
  ...overrides,
});

export const manageDto = (overrides: Record<string, unknown> = {}) => ({
  isActive: true,
  totalStock: 300,
  variantLabels: ["Blue", "100 ml"],
  ratingCount: 10,
  ...overrides,
});

const pagination = (total: number) => ({ page: 1, limit: 8, total, totalPages: Math.ceil(total / 8) || 1 });

export const productsDto = (items = [productItemDto()], total = items.length) => ({ products: items, pagination: pagination(total) });

export const makeShop = (overrides: Record<string, unknown> = {}): Shop => parseShop({ shop: shopDto(overrides) });
export const makeOwnerShop = (): Shop => parseShop({ shop: ownerShopDto() });
export const makePublicProducts = (items = [productItemDto()]) => ({ status: "ok" as const, ...parseShopProducts(productsDto(items)) });
export const makeOwnerProducts = (items = [productItemDto({ manage: manageDto() })]) => makePublicProducts(items);

export const myShopDto = (overrides: Record<string, unknown> = {}) => ({
  slug: "bali-fresh-farm",
  name: "Bali Fresh Farm",
  logoUrl: null,
  description: "Fresh bananas.",
  operatingHours: { open: "09:00", close: "19:00" },
  provinceId: "31",
  cityId: "31.71",
  districtId: "31.71.07",
  subDistrictId: "31.71.07.1001",
  street: "Jl. Kebon Sirih No. 1",
  zipCode: "10270",
  email: "shop@example.com",
  phone: "+6281234567890",
  shippingChannelIds: ["1"],
  ...overrides,
});

export const makeMyShop = (overrides: Record<string, unknown> = {}): MyShop => parseMyShop({ shop: myShopDto(overrides) });
