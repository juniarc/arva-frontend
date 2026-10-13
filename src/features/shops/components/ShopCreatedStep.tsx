import { ButtonLink } from "@/components/ui/Button";

export const PRODUCT_UPLOAD_COMING_SOON = "Adding products is coming soon.";

/**
 * Step 3, Upload Product. The shop already exists at this point. Uploading a product needs the product
 * endpoints, which are not built yet, so this step says so and leads to the new shop.
 */
export function ShopCreatedStep({ shop }: { shop: { slug: string; name: string } }) {
  return (
    <div className="mx-auto max-w-md py-6 text-center lg:mx-0 lg:text-left">
      <p className="text-sm text-ink">
        Your shop <strong>{shop.name}</strong> is open.
      </p>
      <p className="mt-2 text-sm text-muted">{PRODUCT_UPLOAD_COMING_SOON}</p>
      <ButtonLink href={`/shops/${shop.slug}`} variant="brand" className="mt-6 lg:w-auto lg:px-8">
        Go to my shop
      </ButtonLink>
    </div>
  );
}
