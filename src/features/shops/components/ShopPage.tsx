import { BackButton } from "@/features/products/components/BackButton";
import type { ShopProductsResult } from "../data/shop.loader";
import type { Shop } from "../types";
import { EditShopButton } from "./EditShopButton";
import { OwnerShopDetails } from "./OwnerShopDetails";
import { ShopDescription } from "./ShopDescription";
import { ShopHeader } from "./ShopHeader";
import { ShopProducts } from "./ShopProducts";
import { ShopRatingBox } from "./ShopRatingBox";

interface ShopPageProps {
  shop: Shop;
  products: ShopProductsResult;
  isLoggedIn: boolean;
}

/**
 * The shop page for everyone. The owner's controls and details appear only when the backend
 * said `isOwner` and sent `ownerDetails`: nothing here decides ownership on its own.
 */
export function ShopPage({ shop, products, isLoggedIn }: ShopPageProps) {
  return (
    <>
      {/* Mobile and tablet: the back arrow under the global header (the header already has search, cart and menu). */}
      <div className="flex items-center px-2 py-1 lg:hidden">
        <BackButton className="bg-transparent shadow-none" />
      </div>

      <div className="mx-auto max-w-300 px-4 pb-10 pt-2 lg:px-6 lg:pt-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <ShopHeader shop={shop} />
          <ShopRatingBox shop={shop} />
        </div>

        <ShopDescription shop={shop}>{shop.isOwner && <EditShopButton />}</ShopDescription>

        {shop.isOwner && shop.ownerDetails && <OwnerShopDetails details={shop.ownerDetails} />}

        <ShopProducts slug={shop.slug} isOwner={shop.isOwner} isLoggedIn={isLoggedIn} result={products} />
      </div>
    </>
  );
}
