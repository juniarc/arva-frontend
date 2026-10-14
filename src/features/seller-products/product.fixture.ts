/** What GET /products/mine/:id sends for one of the owner's products. */
export const ownedDto = (overrides: Record<string, unknown> = {}) => ({
  product: {
    id: 42,
    slug: "banana",
    name: "Banana",
    description: "Sweet.",
    categoryId: 2,
    tags: ["corn"],
    discountPercent: 10,
    shipping: { weightGrams: 300, lengthCm: 30, widthCm: 20, heightCm: 10, fee: 1000 },
    variants: [
      { id: 1, label: "1 kg", price: 10000, stock: 3, unit: "kg" },
      { id: 2, label: "500 g", price: 6000, stock: 5, unit: "g" },
    ],
    images: [
      { id: 11, url: "http://localhost:4000/uploads/products/a.png" },
      { id: 12, url: "http://localhost:4000/uploads/products/b.png" },
    ],
    ...overrides,
  },
});
