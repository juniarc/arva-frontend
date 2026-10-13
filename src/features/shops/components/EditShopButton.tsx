import { ButtonLink } from "@/components/ui/Button";

/** Owner only: the page renders this only when the backend said the viewer owns the shop. */
export function EditShopButton() {
  return (
    <ButtonLink href="/my-shop/edit" variant="brand" className="w-auto px-6">
      Edit Shop Info
    </ButtonLink>
  );
}
