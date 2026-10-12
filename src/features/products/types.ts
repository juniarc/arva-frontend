export type Category = {
  id: string;
  slug: string;
  name: string;
  /** Picks the icon, see data/categories.ts. */
  iconKey: string;
};

export type ProductVariant = {
  id: string;
  /** Shown on the chip, e.g. "500 ml" or "1 kg". Unique within a product. */
  label: string;
  /** Unit shown after the price and stock, e.g. "kg" or "pcs". */
  unit: string;
  /** IDR, for this variant. */
  price: number;
  /** Price before the discount. Only set when the variant is discounted. */
  originalPrice?: number;
  /** Units available for this variant. */
  stock: number;
};

/** A product as it appears in lists and on cards (GET /home, GET /products). */
export type Product = {
  id: string;
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  /** The lowest variant price. */
  price: number;
  /** Price before the discount, from the same variant as `price`. */
  originalPrice?: number;
  discountPercent?: number;
  /** 0 to 5, one decimal. */
  rating: number;
  soldCount: number;
  city: string;
  imageUrl: string;
  shopSlug: string;
  shopName: string;
};

/** The few product fields the Add to Cart modal shows before (or without) loading the details. */
export type ProductSummary = Pick<Product, "slug" | "name" | "categoryName" | "imageUrl" | "price">;

export type ProductImage = { id: string; url: string; alt: string };

export type ProductReview = {
  id: string;
  username: string;
  avatarUrl?: string;
  /** 1 to 5, whole numbers. */
  rating: number;
  /** For example "1 week ago". Worked out on the server from the review's date. */
  createdAgo: string;
  text: string;
};

export type ProductShop = {
  slug: string;
  name: string;
  city: string;
  logoUrl?: string;
  rating?: number;
  ratingCount?: number;
};

export type ProductRating = { average: number; ratingCount: number; reviewCount: number };

/** One product with everything the product page shows (GET /products/:slug). */
export type ProductDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  soldCount: number;
  rating: ProductRating;
  images: ProductImage[];
  /** Always at least one. */
  variants: [ProductVariant, ...ProductVariant[]];
  /** The variant selected when the page opens. */
  defaultVariantId: string;
  shop: ProductShop;
  /** Up to 10 reviews, newest first. */
  reviewPreview: ProductReview[];
};

/** Everything the product page shows. Built by `getProductPage()` in data/product.loader.ts. */
export type ProductPageData = {
  product: ProductDetail;
  shopProducts: Product[];
  recommended: Product[];
};
