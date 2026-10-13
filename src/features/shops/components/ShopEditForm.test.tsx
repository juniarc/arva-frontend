import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeMyShop, myShopDto } from "../shop.fixture";
import {
  CHANNELS_UNAVAILABLE_MESSAGE,
  FAILED_MESSAGE,
  REDIRECT_DELAY_MS,
  REGIONS_UNAVAILABLE_MESSAGE,
  SAVED_MESSAGE,
  ShopEditForm,
} from "./ShopEditForm";

const { push, back } = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back, refresh: vi.fn(), replace: vi.fn() }) }));

/** The browser only calls our own /api routes, so a fake fetch that answers them is all the "backend" we need. */
type Handler = (request: { body: unknown }) => Response | Promise<Response>;
const handlers = new Map<string, Handler>();
const requests: { method: string; url: string; body: unknown }[] = [];
const json = (status: number, body: unknown) => () => new Response(JSON.stringify(body), { status });

const channels = [
  { id: "1", name: "JNE" },
  { id: "2", name: "J&T Express" },
];

beforeEach(() => {
  vi.clearAllMocks();
  handlers.clear();
  requests.length = 0;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : init?.body;
    requests.push({ method, url, body });
    const handler = handlers.get(`${method} ${url}`) ?? json(404, { message: "Not found." });
    return handler({ body });
  });
  handlers.set("GET /api/regions/provinces", json(200, { items: [{ id: "31", name: "DKI Jakarta" }, { id: "32", name: "Jawa Barat" }] }));
  handlers.set("GET /api/regions/provinces/31/cities", json(200, { items: [{ id: "31.71", name: "Jakarta Pusat" }] }));
  handlers.set("GET /api/regions/provinces/32/cities", json(200, { items: [{ id: "32.73", name: "Kota Bandung" }] }));
  handlers.set("GET /api/regions/cities/31.71/districts", json(200, { items: [{ id: "31.71.07", name: "Tanah Abang" }] }));
  handlers.set("GET /api/regions/districts/31.71.07/sub-districts", json(200, { items: [{ id: "31.71.07.1001", name: "Gelora" }] }));
});

afterEach(() => vi.useRealTimers());

const puts = () => requests.filter((request) => request.method === "PUT");
const calledNothing = () => expect(puts()).toHaveLength(0);

async function renderForm(overrides: Record<string, unknown> = {}, list: typeof channels | null = channels) {
  const user = userEvent.setup();
  render(<ShopEditForm shop={makeMyShop(overrides)} channels={list} />);
  // The saved regions are chosen once their lists have loaded.
  await waitFor(() => expect(screen.getByLabelText("Sub-district")).toHaveValue("31.71.07.1001"));
  return user;
}

const save = (user: ReturnType<typeof userEvent.setup>) => user.click(screen.getByRole("button", { name: "Save" }));

describe("ShopEditForm", () => {
  it("starts with the shop's saved values, and loads nothing but the region lists", async () => {
    await renderForm();

    expect(screen.getByLabelText("Shop Name")).toHaveValue("Bali Fresh Farm");
    expect(screen.getByLabelText("Province")).toHaveValue("31");
    expect(screen.getByLabelText("City")).toHaveValue("31.71");
    expect(screen.getByLabelText("District")).toHaveValue("31.71.07");
    expect(screen.getByLabelText("Address Street")).toHaveValue("Jl. Kebon Sirih No. 1");
    expect(screen.getByLabelText("Email")).toHaveValue("shop@example.com");
    expect(screen.getByLabelText("Phone Number")).toHaveValue("+6281234567890");
    expect(screen.getByLabelText("Opening Hours")).toHaveValue("09:00");
    expect(screen.getByLabelText("Closing Hours")).toHaveValue("19:00");
    expect(screen.getByRole("checkbox", { name: "JNE" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "J&T Express" })).not.toBeChecked();
    expect(requests.every((request) => request.url.startsWith("/api/regions/"))).toBe(true);
  });

  it("groups the shipping channels as checkboxes in a fieldset", async () => {
    await renderForm();
    expect(screen.getByRole("group", { name: "Shipping Channel" })).toBeInTheDocument();
  });

  it("Save with a blank shop name shows 'Field cannot be empty.' and makes no API call", async () => {
    const user = await renderForm();
    await user.clear(screen.getByLabelText("Shop Name"));

    await save(user);

    expect(await screen.findByText("Field cannot be empty.")).toBeInTheDocument();
    expect(screen.getByLabelText("Shop Name")).toHaveAccessibleDescription("Field cannot be empty.");
    calledNothing();
  });

  it("a closing time earlier than the opening time shows an error", async () => {
    const user = await renderForm();
    await user.clear(screen.getByLabelText("Closing Hours"));
    await user.type(screen.getByLabelText("Closing Hours"), "08:00");

    await save(user);

    expect(await screen.findByText("Closing time must be later than opening time.")).toBeInTheDocument();
    calledNothing();
  });

  it("needs at least one shipping channel", async () => {
    const user = await renderForm();
    await user.click(screen.getByRole("checkbox", { name: "JNE" }));

    await save(user);

    expect(await screen.findByText("Choose at least one shipping channel.")).toBeInTheDocument();
    calledNothing();
  });

  it("lets the owner pick more than one channel", async () => {
    handlers.set("PUT /api/shops/me", json(200, { shop: myShopDto({ shippingChannelIds: ["1", "2"] }) }));
    const user = await renderForm();
    await user.click(screen.getByRole("checkbox", { name: "J&T Express" }));

    await save(user);

    await screen.findByText(SAVED_MESSAGE);
    expect(puts()[0]?.body).toMatchObject({ shippingChannelIds: ["1", "2"] });
  });

  it("changing the province clears the city, district and sub-district", async () => {
    const user = await renderForm();

    await user.selectOptions(screen.getByLabelText("Province"), "32");

    expect(screen.getByLabelText("City")).toHaveValue("");
    expect(screen.getByLabelText("District")).toHaveValue("");
    expect(screen.getByLabelText("Sub-district")).toHaveValue("");
    expect(screen.getByLabelText("District")).toBeDisabled();
    expect(screen.getByLabelText("District")).toHaveAccessibleDescription("Choose a city first.");
    await screen.findByRole("option", { name: "Kota Bandung" });
  });

  it("a successful save shows the success message and sends the lowercase email, ids and times", async () => {
    handlers.set("PUT /api/shops/me", json(200, { shop: myShopDto({ name: "New Name" }) }));
    const user = await renderForm();
    await user.clear(screen.getByLabelText("Shop Name"));
    await user.type(screen.getByLabelText("Shop Name"), "  New Name ");
    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "Shop@Example.COM");

    await save(user);

    expect(await screen.findByRole("status", { name: "" })).toHaveTextContent(SAVED_MESSAGE);
    expect(puts()).toEqual([
      expect.objectContaining({
        url: "/api/shops/me",
        body: {
          name: "New Name",
          provinceId: "31",
          cityId: "3171",
          districtId: "317107",
          subDistrictId: "3171071001",
          street: "Jl. Kebon Sirih No. 1",
          shippingChannelIds: ["1"],
          email: "shop@example.com",
          phone: "+6281234567890",
          openingTime: "09:00",
          closingTime: "19:00",
        },
      }),
    ]);
  });

  it("goes back to the shop after a short delay, or when Back is tapped", async () => {
    handlers.set("PUT /api/shops/me", json(200, { shop: myShopDto({ slug: "new-slug" }) }));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ShopEditForm shop={makeMyShop()} channels={channels} />);
    await waitFor(() => expect(screen.getByLabelText("Sub-district")).toHaveValue("31.71.07.1001"));

    await save(user);
    await screen.findByText(SAVED_MESSAGE);
    expect(push).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(REDIRECT_DELAY_MS);
    });

    expect(push).toHaveBeenCalledWith("/shops/new-slug");
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("a 409 for the shop name keeps the form open and shows the message under Shop Name", async () => {
    handlers.set("PUT /api/shops/me", json(409, { message: "This shop name is already taken.", field: "name" }));
    const user = await renderForm();

    await save(user);

    expect(await screen.findByText("This shop name is already taken.")).toBeInTheDocument();
    expect(screen.getByLabelText("Shop Name")).toHaveAccessibleDescription("This shop name is already taken.");
    expect(screen.getByLabelText("Shop Name")).toHaveValue("Bali Fresh Farm");
    expect(screen.queryByText(FAILED_MESSAGE)).not.toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("a 400 with field errors shows each message under its field and keeps the values", async () => {
    handlers.set("PUT /api/shops/me", json(400, { message: "Invalid.", errors: { street: "Street is not valid.", cityId: "City does not belong to the province." } }));
    const user = await renderForm();

    await save(user);

    expect(await screen.findByText("Street is not valid.")).toBeInTheDocument();
    // The street is described by its counter and its error.
    expect(screen.getByLabelText("Address Street")).toHaveAccessibleDescription(/Street is not valid\./);
    expect(screen.getByLabelText("City")).toHaveAccessibleDescription("City does not belong to the province.");
    expect(screen.getByLabelText("Shop Name")).toHaveValue("Bali Fresh Farm");
  });

  it.each([
    ["a server error", () => json(500, { message: "SQLSTATE secret" })],
    ["a 404", () => json(404, { message: "Not found." })],
    ["an answer that is not a shop", () => json(200, { nope: true })],
  ])("%s shows the general failure message and keeps the values", async (_name, handler) => {
    handlers.set("PUT /api/shops/me", handler());
    const user = await renderForm();

    await save(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(FAILED_MESSAGE);
    expect(screen.queryByText(/SQLSTATE|Not found/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Shop Name")).toHaveValue("Bali Fresh Farm");
  });

  it("covers the form with a Saving spinner and disables everything while saving", async () => {
    let finish: (response: Response) => void = () => undefined;
    handlers.set("PUT /api/shops/me", () => new Promise<Response>((resolve) => (finish = resolve)));
    const user = await renderForm();

    await save(user);

    expect(await screen.findByRole("status", { name: "Saving" })).toBeInTheDocument();
    expect(screen.getByLabelText("Shop Name")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    await act(async () => finish(new Response(JSON.stringify({ shop: myShopDto() }), { status: 200 })));
    await waitFor(() => expect(screen.queryByRole("status", { name: "Saving" })).not.toBeInTheDocument());
  });

  it("Cancel returns to the shop page and makes no API call", async () => {
    const user = await renderForm();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(push).toHaveBeenCalledWith("/shops/bali-fresh-farm");
    calledNothing();
  });

  it("says so and disables Save when the shipping channels could not be loaded", async () => {
    await renderForm({}, null);

    expect(screen.getByRole("alert")).toHaveTextContent(CHANNELS_UNAVAILABLE_MESSAGE);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("says so and disables Save when the region endpoints return 404", async () => {
    handlers.delete("GET /api/regions/provinces");
    render(<ShopEditForm shop={makeMyShop()} channels={channels} />);

    expect(await screen.findByRole("alert")).toHaveTextContent(REGIONS_UNAVAILABLE_MESSAGE);
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
