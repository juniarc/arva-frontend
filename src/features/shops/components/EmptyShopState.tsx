import { Store } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { BackButton } from "@/features/products/components/BackButton";

/** "Let's Open Your Shop": shown at /my-shop when the user has no shop. */
export function EmptyShopState() {
  return (
    <>
      <div className="flex items-center px-2 py-1 lg:hidden">
        <BackButton className="bg-transparent shadow-none" />
      </div>

      <div className="mx-auto flex max-w-xl flex-col items-center px-4 pb-16 pt-6 text-center lg:pt-16">
        <h1 className="font-serif text-xl font-bold text-ink lg:text-3xl">Let&apos;s Open Your Shop</h1>
        <p className="mt-4 text-sm text-ink">
          Let&apos;s open your shop and share your fresh, high-quality agriculture products with customers who value
          healthy and sustainable living.
        </p>
        <ButtonLink href="/my-shop/create" variant="brand" className="mt-6 lg:w-auto lg:px-12">
          Create Shop
        </ButtonLink>

        {/* There is no illustration file yet, so this is a box with a description. */}
        <div
          role="img"
          aria-label="Illustration of a farmer's market stall"
          className="mt-10 flex aspect-square w-full max-w-xs items-center justify-center rounded-md bg-surface text-muted"
        >
          <Store className="size-1/3" strokeWidth={1} aria-hidden="true" />
        </div>
      </div>
    </>
  );
}
