import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { OrderHistoryPage } from "@/features/orders/components/OrderHistoryPage";
import { getOrders } from "@/features/orders/data/orders.loader";
import { redirectToLogin, requireUser } from "@/lib/auth/require-user";

export const metadata: Metadata = { title: "My Orders" };

const ORDERS_PATH = "/orders";
const MAX_PAGE = 100_000;

interface OrdersRouteProps {
  searchParams: Promise<{ page?: string | string[] }>;
}

/** A positive whole number, or 1. Nothing else from the URL reaches the API. */
function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d{1,6}$/.test(raw)) return 1;
  return Math.min(Math.max(Number(raw), 1), MAX_PAGE);
}

/** Server Component: checks the session and loads the buyer's orders. */
export default async function OrdersRoute({ searchParams }: OrdersRouteProps) {
  const { token } = await requireUser(ORDERS_PATH);
  const page = parsePage((await searchParams).page);

  const result = await getOrders(token, page);
  if (result.status === "unauthorized") redirectToLogin(ORDERS_PATH);

  // A page number past the end (for example from an old link): show the last page instead.
  const last = Math.max(1, result.pagination.totalPages);
  if (page > last) redirect(last === 1 ? ORDERS_PATH : `${ORDERS_PATH}?page=${last}`);

  return <OrderHistoryPage orders={result.orders} pagination={result.pagination} />;
}
