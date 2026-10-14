import { proxyCreateProduct } from "@/features/seller-products/api/product.server";

/** Lists a new product in the user's shop: the product as JSON in "data", and up to 5 photos in "images". */
export async function POST(request: Request) {
  return proxyCreateProduct(request);
}
