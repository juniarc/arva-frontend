export type CategorySlug = "seeds" | "vegetables" | "fruits" | "fertilizers" | "equipments";

export type ProductVariant = {
  id: string;
  /** Shown on the chip, e.g. "500 ml" or "1 kg". Unique within a product. */
  label: string;
  /** IDR, for this variant. */
  price: number;
  /** Units available for this variant. */
  stock: number;
  /** Unit shown after the price and stock, e.g. "kg" or "pcs". */
  unit: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  categorySlug: CategorySlug;
  categoryName: string;
  /** Price shown on the card. Equals the first variant's price. */
  price: number;
  /** Price before the discount. Only set when discountPercent is above 0. */
  originalPrice?: number;
  discountPercent?: number;
  /** 0 to 5, one decimal. */
  rating: number;
  soldCount: number;
  city: string;
  imageUrl: string;
  shopName: string;
  /** Always at least one. */
  variants: [ProductVariant, ...ProductVariant[]];
};
