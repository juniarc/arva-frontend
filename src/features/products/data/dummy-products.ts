import type { CategorySlug, Product, ProductVariant } from "../types";

/** [label, list price in IDR, stock] */
type VariantSeed = [label: string, listPrice: number, stock: number];

type Seed = {
  name: string;
  slug: string;
  categorySlug: CategorySlug;
  categoryName: string;
  unit: string;
  variants: [VariantSeed, ...VariantSeed[]];
  discountPercent?: number;
  rating: number;
  soldCount: number;
  city: string;
  shopName: string;
};

/**
 * Builds a Product from a compact seed. A discount applies to every variant's list price,
 * and the card price is the first variant's price.
 */
function toProduct(seed: Seed, index: number): Product {
  const { variants, unit, discountPercent, ...rest } = seed;
  const hasDiscount = discountPercent !== undefined && discountPercent > 0;
  const factor = hasDiscount ? 1 - discountPercent / 100 : 1;
  const id = `p${index + 1}`;

  const build = ([label, listPrice, stock]: VariantSeed, position: number): ProductVariant => ({
    id: `${id}-v${position + 1}`,
    label,
    price: Math.round(listPrice * factor),
    stock,
    unit,
  });
  const [firstSeed, ...otherSeeds] = variants;
  const firstVariant = build(firstSeed, 0);

  return {
    ...rest,
    id,
    price: firstVariant.price,
    ...(hasDiscount ? { originalPrice: firstSeed[1], discountPercent } : {}),
    imageUrl: `/images/dummy/${seed.slug}.jpg`,
    variants: [firstVariant, ...otherSeeds.map((seed, position) => build(seed, position + 1))],
  };
}

const SEEDS: Seed[] = [
  // The design shows "2000 ml" twice, so the fourth chip is "5000 ml" (labels must be unique).
  // The unit stays "kg" so the stock line reads "Stock : 250 kg".
  { name: "Bali's Banana Fruit", slug: "balis-banana-fruit", categorySlug: "fruits", categoryName: "Fruits", unit: "kg", variants: [["500 ml", 1087, 250], ["1000 ml", 2000, 180], ["2000 ml", 3800, 90], ["5000 ml", 8500, 40]], discountPercent: 8, rating: 3.4, soldCount: 501, city: "Kab. Bandung", shopName: "Kebun Bali" },
  // One variant is sold out, to test the out-of-stock state.
  { name: "Manggo", slug: "manggo", categorySlug: "fruits", categoryName: "Fruits", unit: "kg", variants: [["1 kg", 2000, 120], ["2 kg", 3800, 60], ["5 kg", 9000, 0]], rating: 3.4, soldCount: 501, city: "Kab. Bandung", shopName: "Tani Makmur" },
  { name: "Java's Cucumber", slug: "javas-cucumber", categorySlug: "vegetables", categoryName: "Vegetables", unit: "kg", variants: [["500 g", 1111, 300], ["1 kg", 2000, 150]], discountPercent: 10, rating: 3.4, soldCount: 501, city: "Kab. Bandung", shopName: "Kebun Jawa" },
  { name: "Granny Smith Apple", slug: "granny-smith-apple", categorySlug: "fruits", categoryName: "Fruits", unit: "kg", variants: [["500 g", 1087, 200], ["1 kg", 2000, 100], ["2 kg", 3800, 40]], discountPercent: 8, rating: 4.1, soldCount: 320, city: "Kota Malang", shopName: "Apel Batu" },
  { name: "Sweet Orange", slug: "sweet-orange", categorySlug: "fruits", categoryName: "Fruits", unit: "kg", variants: [["1 kg", 1500, 350], ["2 kg", 2800, 150], ["5 kg", 6500, 60]], rating: 4.3, soldCount: 870, city: "Kab. Garut", shopName: "Jeruk Garut" },
  { name: "Red Dragon Fruit", slug: "red-dragon-fruit", categorySlug: "fruits", categoryName: "Fruits", unit: "kg", variants: [["500 g", 2500, 90], ["1 kg", 4800, 60]], discountPercent: 12, rating: 4.5, soldCount: 410, city: "Kab. Banyuwangi", shopName: "Buah Naga Timur" },
  { name: "Fresh Carrots 500g", slug: "fresh-carrots-500g", categorySlug: "vegetables", categoryName: "Vegetables", unit: "kg", variants: [["500 g", 1800, 260], ["1 kg", 3400, 110]], rating: 4.0, soldCount: 640, city: "Kab. Lembang", shopName: "Sayur Lembang" },
  { name: "Spinach Bunch", slug: "spinach-bunch", categorySlug: "vegetables", categoryName: "Vegetables", unit: "pcs", variants: [["1 bunch", 1053, 200], ["3 bunches", 3000, 80]], discountPercent: 5, rating: 3.9, soldCount: 280, city: "Kab. Bogor", shopName: "Sayur Bogor" },
  { name: "Tomato Seeds Premium", slug: "tomato-seeds-premium", categorySlug: "seeds", categoryName: "Seeds", unit: "pack", variants: [["10 seeds", 5000, 500], ["50 seeds", 18000, 200], ["100 seeds", 32000, 75]], rating: 4.6, soldCount: 1200, city: "Kab. Bandung", shopName: "Benih Unggul" },
  { name: "Chili Seeds Pack", slug: "chili-seeds-pack", categorySlug: "seeds", categoryName: "Seeds", unit: "pack", variants: [["1 pack", 4500, 400], ["3 packs", 12000, 150]], discountPercent: 15, rating: 4.4, soldCount: 760, city: "Kota Bandung", shopName: "Benih Unggul" },
  { name: "Organic Compost 5kg", slug: "organic-compost-5kg", categorySlug: "fertilizers", categoryName: "Fertilizers", unit: "bag", variants: [["5 kg", 25000, 120], ["10 kg", 45000, 30]], rating: 4.7, soldCount: 930, city: "Kab. Bogor", shopName: "Pupuk Alami" },
  { name: "NPK Fertilizer 1kg", slug: "npk-fertilizer-1kg", categorySlug: "fertilizers", categoryName: "Fertilizers", unit: "bag", variants: [["1 kg", 18000, 140], ["2 kg", 34000, 60]], discountPercent: 10, rating: 4.2, soldCount: 450, city: "Kota Cimahi", shopName: "Pupuk Alami" },
  { name: "Hand Sprayer 2L", slug: "hand-sprayer-2l", categorySlug: "equipments", categoryName: "Equipments", unit: "pcs", variants: [["Standard", 35000, 45], ["Pro", 48000, 15]], rating: 4.3, soldCount: 380, city: "Kab. Bandung", shopName: "Alat Tani Jaya" },
  { name: "Garden Trowel Set", slug: "garden-trowel-set", categorySlug: "equipments", categoryName: "Equipments", unit: "pcs", variants: [["Single", 28000, 60], ["Set of 3", 45000, 25]], discountPercent: 8, rating: 4.1, soldCount: 210, city: "Kota Bandung", shopName: "Alat Tani Jaya" },
  { name: "Pruning Shears", slug: "pruning-shears", categorySlug: "equipments", categoryName: "Equipments", unit: "pcs", variants: [["Small", 45000, 35], ["Large", 49000, 12]], rating: 4.8, soldCount: 305, city: "Kab. Bekasi", shopName: "Alat Tani Jaya" },
  // Every variant is sold out, to test the whole-product out-of-stock state.
  { name: "Watering Can 5L", slug: "watering-can-5l", categorySlug: "equipments", categoryName: "Equipments", unit: "pcs", variants: [["5 L", 22000, 0]], rating: 4.0, soldCount: 190, city: "Kota Cimahi", shopName: "Alat Tani Jaya" },
];

export const DUMMY_PRODUCTS: Product[] = SEEDS.map(toProduct);
