/** One row in the mobile cart drawer. */
export interface CartPreviewItem {
  id: string;
  name: string;
  imageUrl: string;
  variant: string;
  quantity: number;
  /** Already formatted, e.g. "Rp 1.000". */
  price: string;
}
