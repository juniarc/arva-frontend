import { BackButton } from "@/features/products/components/BackButton";

/**
 * Mobile and tablet only: a slim bar with the back arrow, under the global header.
 * The global header already has search, cart and menu, so they are not repeated here
 * (same approach as the product page, which also leaves the global header unchanged).
 */
export function CartHeader() {
  return (
    <div className="flex items-center px-2 py-1 lg:hidden">
      <BackButton className="bg-transparent shadow-none" />
    </div>
  );
}
