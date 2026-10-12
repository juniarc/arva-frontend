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

/** A product as it appears in lists and on cards. */
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
  shopName: string;
};

/** One product with all its variants (GET /products/:slug). */
export type ProductDetail = Product & {
  description: string;
  /** Always at least one. */
  variants: [ProductVariant, ...ProductVariant[]];
};

export type ProductImage = { id: string; url: string; alt: string };

export type ProductReview = {
  id: string;
  username: string;
  avatarUrl: string;
  /** 1 to 5, whole numbers. */
  rating: number;
  /** For example "1 week ago". */
  createdAgo: string;
  text: string;
};

export type ProductShop = {
  slug: string;
  name: string;
  city: string;
  /** Not in the API yet, so the shop card only shows them when they are set. */
  rating?: number;
  ratingCount?: number;
  logoUrl?: string;
};

export type ReviewSummary = { averageRating: number; ratingCount: number; reviewCount: number };

/** Everything the product page shows. Built by `getProductPage()` in data/product.loader.ts. */
export type ProductPageData = {
  product: ProductDetail;
  images: ProductImage[];
  shop: ProductShop;
  reviewSummary: ReviewSummary;
  reviews: ProductReview[];
  shopProducts: Product[];
  recommended: Product[];
};
