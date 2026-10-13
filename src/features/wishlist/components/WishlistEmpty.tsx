import { ButtonLink } from "@/components/ui/Button";

export function WishlistEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-20 text-center">
      <p className="font-serif text-2xl font-bold">Your wishlist is empty</p>
      <ButtonLink href="/products" variant="brand" className="w-auto px-8">
        Start shopping
      </ButtonLink>
    </div>
  );
}
