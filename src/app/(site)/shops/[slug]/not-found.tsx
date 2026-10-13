import { ButtonLink } from "@/components/ui/Button";

export default function ShopNotFound() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-bold text-ink">Shop not found</h1>
      <p className="text-sm text-muted">This shop does not exist or is no longer available.</p>
      <ButtonLink href="/products" variant="brand" className="w-auto">
        Browse products
      </ButtonLink>
    </div>
  );
}
