import { redirect } from "next/navigation";

/** The mobile menu's "My Shop" link points to /shop. The shop entry is /my-shop, so this sends it there. */
export default function ShopEntryRedirect() {
  redirect("/my-shop");
}
