import "server-only";
import { requestJson } from "@/lib/api/http";
import { getEnv } from "@/lib/env";
import { logServerError } from "@/lib/logger";
import { OrderMappingError, parseOrderPage } from "../mappers/order.mapper";
import type { OrderPage } from "../types";

const LOAD_TIMEOUT_MS = 8_000;
export const ORDERS_PAGE_SIZE = 10;

export type OrdersLoadResult = ({ status: "ok" } & OrderPage) | { status: "unauthorized" };

/** The orders could not be loaded for a reason other than "not logged in". The route's error page shows. */
export class OrdersLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrdersLoadError";
  }
}

/** GET /orders with the user's token, newest first. */
export async function getOrders(token: string, page: number): Promise<OrdersLoadResult> {
  const params = new URLSearchParams({ page: String(page), limit: String(ORDERS_PAGE_SIZE) });
  const result = await requestJson(`${getEnv().API_BASE_URL}/orders?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
    timeoutMs: LOAD_TIMEOUT_MS,
  });

  if (!result.ok) {
    if (result.reason === "http" && result.status === 401) return { status: "unauthorized" };
    logServerError("orders.load_failed", { endpoint: "/orders", status: result.status, reason: result.reason });
    throw new OrdersLoadError("Could not load your orders.");
  }

  try {
    return { status: "ok", ...parseOrderPage(result.data) };
  } catch (error) {
    if (error instanceof OrderMappingError) {
      logServerError("orders.unexpected_response", { endpoint: "/orders", status: result.status });
    }
    throw error;
  }
}
