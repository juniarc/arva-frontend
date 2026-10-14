import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { groupByShop, OrderMappingError, parseOrderPage } from "../mappers/order.mapper";
import { orderDto, orderPageDto } from "../orders.fixture";
import { NO_ORDERS_MESSAGE, OrderHistoryPage } from "./OrderHistoryPage";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

describe("parseOrderPage", () => {
  it("maps the orders and their pages", () => {
    const page = parseOrderPage(orderPageDto());
    expect(page.orders[0]?.id).toBe("1");
    expect(page.orders[0]?.items.map((item) => item.id)).toEqual(["1", "2"]);
    expect(page.pagination.total).toBe(1);
  });

  it("drops an unsafe photo URL, and rejects a wrong shape", () => {
    const unsafe = orderDto({ items: [{ ...orderDto().items[0], imageUrl: "javascript:alert(1)" }] });
    expect(parseOrderPage(orderPageDto([unsafe])).orders[0]?.items[0]?.imageUrl).toBe("");
    expect(() => parseOrderPage({ orders: [{ id: 1 }] })).toThrow(OrderMappingError);
    expect(() => parseOrderPage(orderPageDto([orderDto({ status: "LOST" })]))).toThrow(OrderMappingError);
  });

  it("groups an order's lines by shop", () => {
    const [order] = parseOrderPage(orderPageDto()).orders;
    expect(groupByShop(order!).map((group) => group.shopName)).toEqual(["Agro Sentosa", "Bali Fresh Farm"]);
  });
});

describe("OrderHistoryPage", () => {
  it("shows each order with its code, date, status, lines by shop and total", () => {
    render(<OrderHistoryPage {...parseOrderPage(orderPageDto())} />);

    expect(screen.getByRole("heading", { level: 1, name: "My Orders" })).toBeInTheDocument();
    const order = screen.getByRole("article", { name: "#ORD-261014-X22L8W" });
    expect(within(order).getByText("14 Oct 2026, 16:36")).toBeInTheDocument();
    expect(within(order).getByText("Paid")).toBeInTheDocument();
    expect(within(order).getByRole("region", { name: "From Agro Sentosa" })).toBeInTheDocument();
    expect(within(order).getByRole("link", { name: "Tomato Seeds Premium" })).toHaveAttribute("href", "/products/tomato-seeds-premium");
    expect(within(order).getByRole("link", { name: "Bali Fresh Farm" })).toHaveAttribute("href", "/shops/bali-fresh-farm");
    expect(within(order).getByText("1 pack · 1 × Rp 15.000")).toBeInTheDocument();
    expect(within(order).getAllByText("Rp 44.250").length).toBeGreaterThan(0);
  });

  it("shows a product that is gone without a link", () => {
    render(<OrderHistoryPage {...parseOrderPage(orderPageDto())} />);

    expect(screen.getByText("Removed Product")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Removed Product" })).not.toBeInTheDocument();
  });

  it("has the details: address, shipping, payment and the amounts with the voucher", () => {
    render(<OrderHistoryPage {...parseOrderPage(orderPageDto())} />);

    expect(screen.getByText("Order details")).toBeInTheDocument();
    expect(screen.getByText("Agus · 081234567890")).toBeInTheDocument();
    expect(screen.getByText("J&T Express Regular · 2 packages")).toBeInTheDocument();
    expect(screen.getByText(/^QRIS · paid/)).toBeInTheDocument();
    expect(screen.getByText("Voucher SOON25")).toBeInTheDocument();
    expect(screen.getByText("- Rp 3.750")).toBeInTheDocument();
    expect(screen.getByText("Damage protection")).toBeInTheDocument();
  });

  it("says so when there are no orders, with a way to shop", () => {
    render(<OrderHistoryPage {...parseOrderPage(orderPageDto([]))} />);

    expect(screen.getByText(NO_ORDERS_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start Shopping" })).toHaveAttribute("href", "/products");
  });

  it("links the pages of the history", () => {
    const orders = Array.from({ length: 10 }, (_, index) => orderDto({ id: index + 1, code: `ORD-${index + 1}` }));
    render(<OrderHistoryPage {...parseOrderPage(orderPageDto(orders, 25))} />);

    expect(screen.getByRole("link", { name: "Page 2" })).toHaveAttribute("href", "/orders?page=2");
  });
});
