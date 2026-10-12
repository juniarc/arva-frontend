import { ButtonLink } from "@/components/ui/Button";

export default function ProductNotFound() {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-4 px-4 py-16 text-center">
      <h1 className="font-serif text-2xl font-bold text-ink">Product not found</h1>
      <p className="text-sm text-muted">This product does not exist or is no longer available.</p>
      <ButtonLink href="/" variant="brand" className="w-auto">
        Back to home
      </ButtonLink>
    </div>
  );
}
