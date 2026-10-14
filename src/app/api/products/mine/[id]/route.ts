import { proxyDeleteProduct, proxyUpdateProduct } from "@/features/seller-products/api/product.server";

type Context = { params: Promise<{ id: string }> };

/** Saves an edit of one of the user's products (the same multipart body as creating one). */
export async function PUT(request: Request, { params }: Context) {
  return proxyUpdateProduct(request, (await params).id);
}

/** Removes one of the user's products completely. */
export async function DELETE(_request: Request, { params }: Context) {
  return proxyDeleteProduct((await params).id);
}
