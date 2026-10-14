import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE_QUESTION, DeleteProductButton } from "./DeleteProductButton";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: vi.fn() }) }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

const renderButton = () => {
  const user = userEvent.setup();
  render(<DeleteProductButton productId="10" productName="Banana" />);
  return user;
};

describe("DeleteProductButton", () => {
  it("asks first, and Cancel deletes nothing", async () => {
    const user = renderButton();

    await user.click(screen.getByRole("button", { name: "Delete Banana" }));
    expect(screen.getByRole("alertdialog", { name: DELETE_QUESTION })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("Delete removes the product and reloads the shop page", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const user = renderButton();

    await user.click(screen.getByRole("button", { name: "Delete Banana" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(fetchMock).toHaveBeenCalledWith("/api/products/mine/10", expect.objectContaining({ method: "DELETE" }));
    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("says so when the delete fails, and keeps the page as it is", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "Product not found." }), { status: 404 }));
    const user = renderButton();

    await user.click(screen.getByRole("button", { name: "Delete Banana" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Product not found.");
    expect(refresh).not.toHaveBeenCalled();
  });
});
