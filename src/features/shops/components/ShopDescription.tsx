import type { ReactNode } from "react";
import type { Shop } from "../types";

/** The "Shop Description" heading and text. `children` is for the owner's Edit Shop Info button. */
export function ShopDescription({ shop, children }: { shop: Shop; children?: ReactNode }) {
  return (
    <section aria-labelledby="shop-description-heading" className="mt-6 max-w-2xl">
      <h2 id="shop-description-heading" className="font-serif text-xl font-bold text-ink lg:text-2xl">
        Shop Description
      </h2>
      <p className="mt-2 whitespace-pre-line break-words text-sm text-ink">
        {shop.description || "This shop has not added a description yet."}
      </p>
      {children && <div className="mt-4">{children}</div>}
    </section>
  );
}
