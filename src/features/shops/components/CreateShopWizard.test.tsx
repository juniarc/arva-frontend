import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { myShopDto } from "../shop.fixture";
import { CREATE_FAILED_MESSAGE, CreateShopWizard, INCOMPLETE_MESSAGE } from "./CreateShopWizard";
import { PRODUCT_UPLOAD_COMING_SOON } from "./ShopCreatedStep";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn(), refresh: vi.fn() }) }));

type Handler = (request: { body: unknown }) => Response | Promise<Response>;
const handlers = new Map<string, Handler>();
const requests: { method: string; url: string; body: unknown }[] = [];
const json = (status: number, body: unknown) => () => new Response(JSON.stringify(body), { status });

const channels = [
  { id: "1", name: "JNE" },
  { id: "2", name: "J&T Express" },
];

beforeEach(() => {
  handlers.clear();
  requests.length = 0;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    const body = typeof init?.body === "string" ? JSON.parse(init.body) : init?.body;
    requests.push({ method, url, body });
    const handler = handlers.get(`${method} ${url}`) ?? json(404, { message: "Not found." });
    return handler({ body });
  });
  handlers.set("GET /api/regions/provinces", json(200, { items: [{ id: "31", name: "DKI Jakarta" }] }));
  handlers.set("GET /api/regions/provinces/31/cities", json(200, { items: [{ id: "31.71", name: "Jakarta Pusat" }] }));
  handlers.set("GET /api/regions/cities/31.71/districts", json(200, { items: [{ id: "31.71.07", name: "Tanah Abang" }] }));
  handlers.set("GET /api/regions/districts/31.71.07/sub-districts", json(200, { items: [{ id: "31.71.07.1001", name: "Gelora" }] }));
});

type User = ReturnType<typeof userEvent.setup>;
const posts = () => requests.filter((request) => request.method === "POST");
const next = (user: User) => user.click(screen.getByRole("button", { name: "Next" }));
const KTP = "3171234567890001";

async function fillIdentity(user: User) {
  await user.type(screen.getByLabelText("Name"), "Agus Setiawan");
  await user.type(screen.getByLabelText("IC Number (KTP)"), KTP);
  await user.click(screen.getByRole("checkbox", { name: /Terms & Conditions/ }));
}

async function fillShop(user: User) {
  await user.type(screen.getByLabelText("Shop Name"), "Bali Fresh Farm");
  await screen.findByRole("option", { name: "DKI Jakarta" });
  await user.selectOptions(screen.getByLabelText("Province"), "31");
  await screen.findByRole("option", { name: "Jakarta Pusat" });
  await user.selectOptions(screen.getByLabelText("City"), "31.71");
  await screen.findByRole("option", { name: "Tanah Abang" });
  await user.selectOptions(screen.getByLabelText("District"), "31.71.07");
  await screen.findByRole("option", { name: "Gelora" });
  await user.selectOptions(screen.getByLabelText("Sub-district"), "31.71.07.1001");
  await user.type(screen.getByLabelText("Address Street"), "Jl. Kebon Sirih No. 1");
  await user.click(screen.getByRole("checkbox", { name: "JNE" }));
  await user.type(screen.getByLabelText("Email"), "Shop@Example.com");
}

async function goToStep2(user: User) {
  await fillIdentity(user);
  await next(user);
  await screen.findByRole("heading", { level: 1, name: "Shop Information" });
}

describe("CreateShopWizard: step 1, Identity Verification", () => {
  it("starts on step 1 with Back disabled and the progress marked", () => {
    render(<CreateShopWizard channels={channels} />);

    expect(screen.getByRole("heading", { level: 1, name: "Identity Verification" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Identity Verification");
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("Next with empty fields shows the messages and the banner, and stays on step 1", async () => {
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);

    await next(user);

    expect(await screen.findByText(INCOMPLETE_MESSAGE)).toBeInTheDocument();
    expect(screen.getAllByText("Field cannot be empty.")).toHaveLength(2);
    expect(screen.getByText("You must agree to the Terms & Conditions.")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveAccessibleDescription("Field cannot be empty.");
    expect(screen.getByRole("heading", { level: 1, name: "Identity Verification" })).toBeInTheDocument();
  });

  it("the IC number takes digits only, 16 of them", async () => {
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);

    await user.type(screen.getByLabelText("IC Number (KTP)"), "31a71-2345678900012345");

    expect(screen.getByLabelText("IC Number (KTP)")).toHaveValue("3171234567890001");
  });

  it("an IC number with fewer than 16 digits is rejected", async () => {
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);
    await user.type(screen.getByLabelText("Name"), "Agus");
    await user.type(screen.getByLabelText("IC Number (KTP)"), "123456");
    await user.click(screen.getByRole("checkbox", { name: /Terms & Conditions/ }));

    await next(user);

    expect(await screen.findByText("IC number must be exactly 16 digits.")).toBeInTheDocument();
  });

  it("does not move on without the agreement", async () => {
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);
    await user.type(screen.getByLabelText("Name"), "Agus");
    await user.type(screen.getByLabelText("IC Number (KTP)"), KTP);

    await next(user);

    expect(await screen.findByText("You must agree to the Terms & Conditions.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Identity Verification" })).toBeInTheDocument();
  });

  it("a valid step 1 goes to step 2 and makes no request for the identity", async () => {
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);

    await goToStep2(user);

    expect(screen.getByRole("listitem", { current: "step" })).toHaveTextContent("Shop Information");
    expect(posts()).toHaveLength(0);
  });
});

describe("CreateShopWizard: step 2, Shop Information", () => {
  it("Back returns to step 1 with what was typed", async () => {
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);
    await goToStep2(user);
    await user.type(screen.getByLabelText("Shop Name"), "Typed Shop");

    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Identity Verification" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Agus Setiawan");
    expect(screen.getByLabelText("IC Number (KTP)")).toHaveValue(KTP);
    expect(screen.getByRole("checkbox", { name: /Terms & Conditions/ })).toBeChecked();

    await next(user);
    await screen.findByRole("heading", { level: 1, name: "Shop Information" });
    expect(screen.getByLabelText("Shop Name")).toHaveValue("Typed Shop");
  });

  it("Next with empty shop fields shows the messages and sends nothing", async () => {
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);
    await goToStep2(user);

    await next(user);

    expect(await screen.findByText(INCOMPLETE_MESSAGE)).toBeInTheDocument();
    expect(screen.getAllByText("Field cannot be empty.").length).toBeGreaterThan(0);
    expect(screen.getByText("Select a province")).toBeInTheDocument();
    expect(screen.getByText("Choose at least one shipping channel.")).toBeInTheDocument();
    expect(posts()).toHaveLength(0);
  });

  it("creates the shop with the identity and the shop fields, then shows step 3", async () => {
    handlers.set("POST /api/shops", json(201, { shop: myShopDto({ slug: "bali-fresh-farm", name: "Bali Fresh Farm" }) }));
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);
    await goToStep2(user);
    await fillShop(user);

    await next(user);

    expect(await screen.findByRole("heading", { level: 1, name: "Upload Product" })).toBeInTheDocument();
    expect(posts()).toHaveLength(1);
    // Only the shop's fields are sent, with numeric region ids. The identity is not sent.
    expect(posts()[0]?.body).toEqual({
      name: "Bali Fresh Farm",
      provinceId: "31",
      cityId: "3171",
      districtId: "317107",
      subDistrictId: "3171071001",
      street: "Jl. Kebon Sirih No. 1",
      shippingChannelIds: ["1"],
      email: "shop@example.com",
      phone: null,
      openingTime: "09:00",
      closingTime: "17:00",
    });
    expect(screen.getByText(PRODUCT_UPLOAD_COMING_SOON)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to my shop" })).toHaveAttribute("href", "/shops/bali-fresh-farm");
    // The two earlier steps are done.
    const progress = screen.getByRole("list", { name: "Create shop progress" });
    expect(within(progress).getByText("Step 1, done:")).toBeInTheDocument();
  });

  it("shows the Saving spinner while the shop is created", async () => {
    let finish: (response: Response) => void = () => undefined;
    handlers.set("POST /api/shops", () => new Promise<Response>((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);
    await goToStep2(user);
    await fillShop(user);

    await next(user);

    expect(await screen.findByRole("status", { name: "Saving" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    finish(new Response(JSON.stringify({ shop: myShopDto() }), { status: 201 }));
    await screen.findByRole("heading", { level: 1, name: "Upload Product" });
  });

  it("a 409 for the shop name keeps step 2 open and shows the message under Shop Name", async () => {
    handlers.set("POST /api/shops", json(409, { message: "This shop name is already taken.", field: "name" }));
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);
    await goToStep2(user);
    await fillShop(user);

    await next(user);

    expect(await screen.findByText("This shop name is already taken.")).toBeInTheDocument();
    expect(screen.getByLabelText("Shop Name")).toHaveAccessibleDescription("This shop name is already taken.");
    expect(screen.getByLabelText("Shop Name")).toHaveValue("Bali Fresh Farm");
  });

  it("a message for a field the form does not have is not shown, and the general message is", async () => {
    handlers.set("POST /api/shops", json(400, { message: "Invalid.", errors: { icNumber: "Unknown field." } }));
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);
    await goToStep2(user);
    await fillShop(user);

    await next(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(CREATE_FAILED_MESSAGE);
    expect(screen.getByRole("heading", { level: 1, name: "Shop Information" })).toBeInTheDocument();
    expect(screen.queryByText("Unknown field.")).not.toBeInTheDocument();
  });

  it("a 409 without a field (for example 'you already have a shop') shows the backend's message", async () => {
    handlers.set("POST /api/shops", json(409, { message: "You already have a shop." }));
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);
    await goToStep2(user);
    await fillShop(user);

    await next(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("You already have a shop.");
  });

  it.each([
    ["a server error", () => json(500, { message: "SQLSTATE secret" })],
    ["a 404 (not built yet)", () => json(404, { message: "Not found." })],
  ])("%s shows the general failure message and keeps the values", async (_name, handler) => {
    handlers.set("POST /api/shops", handler());
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);
    await goToStep2(user);
    await fillShop(user);

    await next(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(CREATE_FAILED_MESSAGE);
    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Shop Name")).toHaveValue("Bali Fresh Farm");
  });

  it("says so and disables Next when the shipping channels could not be loaded", async () => {
    const user = userEvent.setup();
    render(<CreateShopWizard channels={null} />);
    await goToStep2(user);

    expect(screen.getByRole("alert")).toHaveTextContent("Shipping channels are not available right now.");
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("says so and disables Next when the region endpoints return 404", async () => {
    handlers.delete("GET /api/regions/provinces");
    const user = userEvent.setup();
    render(<CreateShopWizard channels={channels} />);
    await goToStep2(user);

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Address options are not available yet."));
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
