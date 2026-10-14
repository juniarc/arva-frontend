import { ButtonLink } from "@/components/ui/Button";
import { BackButton } from "@/features/products/components/BackButton";
import { Pagination } from "@/features/products/components/Pagination";
import type { OrderPage } from "../types";
import { OrderCard } from "./OrderCard";

export const NO_ORDERS_MESSAGE = "You have not ordered anything yet.";

/** "My Orders": the buyer's orders, newest first, 10 per page. */
export function OrderHistoryPage({ orders, pagination }: OrderPage) {
  const hrefFor = (page: number) => (page <= 1 ? "/orders" : `/orders?page=${page}`);

  return (
    <>
      <div className="flex items-center px-2 py-1 lg:hidden">
        <BackButton className="bg-transparent shadow-none" />
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-10 pt-2 lg:px-6 lg:pt-8">
        <h1 className="mb-4 font-serif text-xl font-bold text-ink lg:mb-6 lg:text-3xl">My Orders</h1>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <p className="text-sm text-ink">{NO_ORDERS_MESSAGE}</p>
            <ButtonLink href="/products" variant="brand" className="w-auto px-8">
              Start Shopping
            </ButtonLink>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-muted">
              {pagination.total} {pagination.total === 1 ? "order" : "orders"}
            </p>
            <ol className="space-y-4">
              {orders.map((order) => (
                <li key={order.id}>
                  <OrderCard order={order} />
                </li>
              ))}
            </ol>
            <Pagination hrefFor={hrefFor} currentPage={pagination.page} totalPages={pagination.totalPages} />
          </>
        )}
      </div>
    </>
  );
}
