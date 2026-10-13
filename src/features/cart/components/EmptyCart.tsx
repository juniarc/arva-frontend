import { ButtonLink } from "@/components/ui/Button";

export function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-20 text-center">
      <h2 className="font-serif text-2xl font-bold">Your cart is empty</h2>
      <ButtonLink href="/products" variant="brand" className="w-auto px-8">
        Start shopping
      </ButtonLink>
    </div>
  );
}
