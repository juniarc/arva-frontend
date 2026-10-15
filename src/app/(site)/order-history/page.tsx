import { redirect } from "next/navigation";

/**
 * Order history is already built at /orders (with its own login check), so this address forwards there
 * instead of showing a "coming soon" placeholder.
 */
export default function OrderHistoryRoute() {
  redirect("/orders");
}
