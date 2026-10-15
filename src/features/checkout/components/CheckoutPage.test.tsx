import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addressDto, draftDto, makeDraft } from "../checkout.fixture";
import { CheckoutPage } from "./CheckoutPage";

const { push, replace, refresh } = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, replace, refresh, back: vi.fn() }) }));

/** The browser only calls our own /api routes, so a fake fetch that answers them is all the "backend" we need. */
type Handler = (request: { body: unknown }) => Response;
const handlers = new Map<string, Handler>();
const requests: { method: string; url: string }[] = [];
const json = (status: number, body: unknown) => () => new Response(JSON.stringify(body), { status });

const shipping = { id: 4, label: "JNE Reguler", estimate: "Estimated time arrival 2 days", price: 12000 };
const voucher = { id: 5, title: "10% Discount", code: "10PDISCOUNT", discountAmount: 12000 };
const payment = { id: 6, label: "Mandiri Virtual Account" };

beforeEach(() => {
  vi.clearAllMocks();
  handlers.clear();
  requests.length = 0;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    requests.push({ method, url });
    const handler = handlers.get(`${method} ${url}`) ?? json(404, { message: "Not found." });
    return handler({ body: init?.body ? JSON.parse(String(init.body)) : undefined });
  });
});

type User = ReturnType<typeof userEvent.setup>;

/** The backend gets region ids only, and answers with the names. This fake backend does the same. */
const REGION_NAMES: Record<string, string> = { "1": "DKI Jakarta", "11": "Jakarta Pusat", "111": "Tanah Abang", "1111": "Kebon Melati" };
function withNames(body: unknown) {
  const address = body as Record<string, unknown>;
  const named = (key: string) => {
    const id = (address[key] as { id: string }).id;
    return { id, name: REGION_NAMES[id] ?? id };
  };
  return { ...address, province: named("province"), city: named("city"), district: named("district"), subDistrict: named("subDistrict") };
}
const dialog = (name: string) => screen.getByRole("dialog", { name });
const payButtons = () => screen.getAllByRole("button", { name: "Pay Now" });
const regionHandlers = () => {
  handlers.set("GET /api/regions/provinces", json(200, { items: [{ id: 1, name: "DKI Jakarta" }, { id: 2, name: "Bali" }] }));
  handlers.set("GET /api/regions/provinces/1/cities", json(200, { items: [{ id: 11, name: "Jakarta Pusat" }] }));
  handlers.set("GET /api/regions/provinces/2/cities", json(200, { items: [{ id: 21, name: "Denpasar" }] }));
  handlers.set("GET /api/regions/cities/11/districts", json(200, { items: [{ id: 111, name: "Tanah Abang" }] }));
  handlers.set("GET /api/regions/districts/111/sub-districts", json(200, { items: [{ id: 1111, name: "Kebon Melati" }] }));
};

async function fillAddressForm(user: User) {
  const form = dialog("Address Detail");
  await user.type(within(form).getByLabelText("Address Label"), "Home");
  await within(form).findByRole("option", { name: "DKI Jakarta" });
  await user.selectOptions(within(form).getByLabelText("Province"), "1");
  await within(form).findByRole("option", { name: "Jakarta Pusat" });
  await user.selectOptions(within(form).getByLabelText("City"), "11");
  await within(form).findByRole("option", { name: "Tanah Abang" });
  await user.selectOptions(within(form).getByLabelText("District"), "111");
  await within(form).findByRole("option", { name: "Kebon Melati" });
  await user.selectOptions(within(form).getByLabelText("Sub-district"), "1111");
  await user.type(within(form).getByLabelText("Address Street"), "Jl. Jalan No.1");
  await user.type(within(form).getByLabelText("Recipient's Name"), "Agus");
  await user.type(within(form).getByLabelText("Phone's Number"), "081234567890");
}

describe("the summary", () => {
  it("shows the server's amounts as they are, without adding them up", () => {
    render(<CheckoutPage initialDraft={makeDraft()} />);

    // 4.000 + 12.000 + 500 + 300 is not 10.000, and the page must not "fix" that.
    expect(screen.getAllByText("Rp 4.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rp 12.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rp 500").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rp 300").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rp 10.000").length).toBeGreaterThan(0);
  });

  it("shows the discount from the server with a minus sign", () => {
    const draft = makeDraft({
      voucher,
      summary: { ...draftDto().summary, discount: 12000, total: 7777 },
    });
    render(<CheckoutPage initialDraft={draft} />);

    expect(screen.getAllByText("- Rp 12.000").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Rp 7.777").length).toBeGreaterThan(0);
    expect(screen.getByText("Product Discount")).toBeInTheDocument();
    expect(screen.getByText("Vouchers successfully used")).toBeInTheDocument();
  });

  it("has one h1 and h2 sections", () => {
    render(<CheckoutPage initialDraft={makeDraft()} />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Checkout" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Delivery Address" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Purchased Items" })).toBeInTheDocument();
  });
});

describe("the address", () => {
  it("asks for an address when the draft has none, and Pay Now is disabled with a hint", () => {
    render(<CheckoutPage initialDraft={makeDraft()} />);

    expect(screen.getByText("Add your address")).toBeInTheDocument();
    for (const button of payButtons()) expect(button).toBeDisabled();
    expect(screen.getAllByText(/Add your address, choose a shipping option and choose a payment method to continue\./).length).toBeGreaterThan(0);
  });

  it("creates an address in an empty form, and then shows it instead of 'Add your address'", async () => {
    const user = userEvent.setup();
    regionHandlers();
    handlers.set("PUT /api/checkout/address", ({ body }) => new Response(JSON.stringify(draftDto({ address: withNames(body) })), { status: 200 }));
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: /Add your address/ }));
    expect(within(dialog("Address Detail")).getByLabelText("Address Label")).toHaveValue("");

    await fillAddressForm(user);
    const save = within(dialog("Address Detail")).getByRole("button", { name: "Save Address" });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByText("Add your address")).not.toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Agus")).toBeInTheDocument();
    expect(screen.getByText("Jl. Jalan No.1, Kebon Melati, Tanah Abang, Jakarta Pusat, DKI Jakarta")).toBeInTheDocument();
  });

  it("sends the address with the region ids only (no names), and nothing else", async () => {
    const user = userEvent.setup();
    regionHandlers();
    let sent: unknown;
    handlers.set("PUT /api/checkout/address", ({ body }) => {
      sent = body;
      return new Response(JSON.stringify(draftDto({ address: withNames(body) })), { status: 200 });
    });
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: /Add your address/ }));
    await fillAddressForm(user);
    const save = within(dialog("Address Detail")).getByRole("button", { name: "Save Address" });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await waitFor(() => expect(sent).toBeDefined());
    expect(sent).toEqual({
      label: "Home",
      province: { id: "1" },
      city: { id: "11" },
      district: { id: "111" },
      subDistrict: { id: "1111" },
      street: "Jl. Jalan No.1",
      recipientName: "Agus",
      phone: "081234567890",
    });
  });

  it("shows a saved address at once, without opening a modal", () => {
    render(<CheckoutPage initialDraft={makeDraft({ address: addressDto })} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Agus")).toBeInTheDocument();
    expect(screen.queryByText("Add your address")).not.toBeInTheDocument();
  });

  it("edits the draft's address only: no profile request is ever made", async () => {
    const user = userEvent.setup();
    regionHandlers();
    handlers.set("PUT /api/checkout/address", ({ body }) => new Response(JSON.stringify(draftDto({ address: withNames(body) })), { status: 200 }));
    render(<CheckoutPage initialDraft={makeDraft({ address: addressDto })} />);

    await user.click(screen.getByRole("button", { name: /Edit address/ }));
    const form = dialog("Address Detail");
    expect(within(form).getByLabelText("Address Label")).toHaveValue("Home");
    expect(within(form).getByLabelText("Recipient's Name")).toHaveValue("Agus");

    await user.clear(within(form).getByLabelText("Address Label"));
    await user.type(within(form).getByLabelText("Address Label"), "Office");
    const save = within(form).getByRole("button", { name: "Save Address" });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Office")).toBeInTheDocument();

    expect(requests.some((request) => request.method === "PUT" && request.url === "/api/checkout/address")).toBe(true);
    expect(requests.filter((request) => /profile/i.test(request.url))).toEqual([]);
    for (const request of requests) expect(request.url).toMatch(/^\/api\/(checkout|regions)/);
  });

  it("removes letters from the phone number as the user types, and counts the characters", async () => {
    const user = userEvent.setup();
    regionHandlers();
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: /Add your address/ }));
    const form = dialog("Address Detail");
    await user.type(within(form).getByLabelText("Phone's Number"), "08a1b2c3");
    await user.type(within(form).getByLabelText("Address Label"), "Home");

    expect(within(form).getByLabelText("Phone's Number")).toHaveValue("08123");
    expect(within(form).getByText("5/15")).toBeInTheDocument();
    expect(within(form).getByText("4/30")).toBeInTheDocument();
    expect(within(form).getByText("0/200")).toBeInTheDocument();
  });

  it("keeps Save disabled while the form is not valid", async () => {
    const user = userEvent.setup();
    regionHandlers();
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: /Add your address/ }));

    expect(within(dialog("Address Detail")).getByRole("button", { name: "Save Address" })).toBeDisabled();
  });

  it("keeps a region select disabled until its parent is chosen, and clears the children when the parent changes", async () => {
    const user = userEvent.setup();
    regionHandlers();
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: /Add your address/ }));
    const form = dialog("Address Detail");
    expect(within(form).getByLabelText("City")).toBeDisabled();
    expect(within(form).getByLabelText("District")).toBeDisabled();
    expect(within(form).getByLabelText("Sub-district")).toBeDisabled();

    await within(form).findByRole("option", { name: "DKI Jakarta" });
    await user.selectOptions(within(form).getByLabelText("Province"), "1");
    await within(form).findByRole("option", { name: "Jakarta Pusat" });
    await user.selectOptions(within(form).getByLabelText("City"), "11");
    await within(form).findByRole("option", { name: "Tanah Abang" });
    expect(within(form).getByLabelText("City")).toHaveValue("11");

    await user.selectOptions(within(form).getByLabelText("Province"), "2");

    expect(within(form).getByLabelText("City")).toHaveValue("");
    expect(within(form).getByLabelText("District")).toHaveValue("");
    expect(within(form).getByLabelText("District")).toBeDisabled();
  });

  it("shows the error inside the modal and keeps it open when saving fails", async () => {
    const user = userEvent.setup();
    regionHandlers();
    handlers.set("PUT /api/checkout/address", json(400, { message: "Phone number is not valid." }));
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: /Add your address/ }));
    await fillAddressForm(user);
    const save = within(dialog("Address Detail")).getByRole("button", { name: "Save Address" });
    await waitFor(() => expect(save).toBeEnabled());
    await user.click(save);

    expect(await within(dialog("Address Detail")).findByRole("alert")).toHaveTextContent("Phone number is not valid.");
    expect(screen.getByRole("dialog", { name: "Address Detail" })).toBeInTheDocument();
    expect(screen.getByText("Add your address")).toBeInTheDocument();
  });

  it("says the address options are not available yet when the region endpoints are missing (404)", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: /Add your address/ }));

    expect(await within(dialog("Address Detail")).findByText("Address options are not available yet.")).toBeInTheDocument();
    expect(within(dialog("Address Detail")).getByLabelText("Province")).toBeDisabled();
    expect(within(dialog("Address Detail")).getByRole("button", { name: "Save Address" })).toBeDisabled();
  });
});

describe("shipping, voucher, payment method and damage protection", () => {
  it("choosing a shipping option replaces the draft with the server's answer", async () => {
    const user = userEvent.setup();
    handlers.set("GET /api/checkout/shipping-options", json(200, { options: [shipping, { ...shipping, id: 8, label: "SiCepat" }] }));
    let sent: unknown;
    handlers.set("PUT /api/checkout/shipping", ({ body }) => {
      sent = body;
      return new Response(JSON.stringify(draftDto({ shipping, summary: { ...draftDto().summary, shippingSubtotal: 12000, total: 20001 } })), { status: 200 });
    });
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: /Select Shipping/ }));
    await user.click(await within(dialog("Shipping Options")).findByRole("button", { name: /JNE Reguler/ }));

    await waitFor(() => expect(screen.getByText("JNE Reguler (Rp 12.000)")).toBeInTheDocument());
    expect(sent).toEqual({ optionId: "4" });
    expect(screen.getAllByText("Rp 20.001").length).toBeGreaterThan(0);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("can use a voucher, and remove it by choosing it again", async () => {
    const user = userEvent.setup();
    handlers.set("GET /api/checkout/vouchers", json(200, { vouchers: [{ ...voucher, description: "Lorem ipsum" }] }));
    const bodies: unknown[] = [];
    handlers.set("PUT /api/checkout/voucher", ({ body }) => {
      bodies.push(body);
      const using = (body as { voucherId: string | null }).voucherId !== null;
      return new Response(
        JSON.stringify(draftDto({ voucher: using ? voucher : null, summary: { ...draftDto().summary, discount: using ? 12000 : 0, total: using ? 4321 : 10000 } })),
        { status: 200 },
      );
    });
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: /Select Voucher/ }));
    await user.click(await within(dialog("Vouchers")).findByRole("button", { name: "Use voucher 10% Discount" }));
    expect(await screen.findByText("Vouchers successfully used")).toBeInTheDocument();
    expect(screen.getAllByText("Rp 4.321").length).toBeGreaterThan(0);
    expect(bodies[0]).toEqual({ voucherId: "5" });

    await user.click(screen.getByRole("button", { name: /Vouchers successfully used/ }));
    expect(within(dialog("Vouchers")).getByText("Lorem ipsum")).toBeInTheDocument();
    await user.click(await within(dialog("Vouchers")).findByRole("button", { name: "Remove voucher 10% Discount" }));

    await waitFor(() => expect(screen.getByText("Select Voucher")).toBeInTheDocument());
    expect(bodies[1]).toEqual({ voucherId: null });
    expect(screen.getAllByText("Rp 10.000").length).toBeGreaterThan(0);
  });

  it("says there are no vouchers when the list is empty", async () => {
    const user = userEvent.setup();
    handlers.set("GET /api/checkout/vouchers", json(200, { vouchers: [] }));
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: /Select Voucher/ }));

    expect(await within(dialog("Vouchers")).findByText("No vouchers available.")).toBeInTheDocument();
  });

  it("choosing a payment method replaces the draft, and unavailable methods cannot be chosen", async () => {
    const user = userEvent.setup();
    handlers.set(
      "GET /api/checkout/payment-methods",
      json(200, { methods: [{ id: 6, label: "Mandiri Virtual Account", available: true }, { id: 7, label: "BCA Virtual Account", available: false }] }),
    );
    handlers.set("PUT /api/checkout/payment-method", json(200, draftDto({ paymentMethod: payment })));
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getAllByRole("button", { name: "See all" })[0]!);
    const group = await within(dialog("Payment Methods")).findByRole("radiogroup", { name: "Payment Methods" });
    expect(within(group).getByRole("radio", { name: /BCA Virtual Account/ })).toBeDisabled();
    expect(within(group).getByText("Unavailable")).toBeInTheDocument();

    await user.click(within(group).getByRole("radio", { name: /Mandiri Virtual Account/ }));

    await waitFor(() => expect(screen.getByText("Mandiri Virtual Account")).toBeInTheDocument());
    expect(screen.queryByText("Select payment method")).not.toBeInTheDocument();
  });

  it("damage protection: the checkbox is named with its fee, and the draft is replaced from the response", async () => {
    const user = userEvent.setup();
    let sent: unknown;
    handlers.set("PUT /api/checkout/damage-protection", ({ body }) => {
      sent = body;
      return new Response(
        JSON.stringify(draftDto({ damageProtection: { enabled: true, fee: 2000 }, summary: { ...draftDto().summary, damageProtectionFee: 2000, total: 12000 } })),
        { status: 200 },
      );
    });
    render(<CheckoutPage initialDraft={makeDraft()} />);

    const box = screen.getByRole("checkbox", { name: "Total damage protection 3 months (Rp 2.000)" });
    expect(box).not.toBeChecked();
    await user.click(box);

    await waitFor(() => expect(screen.getByRole("checkbox", { name: /damage protection/ })).toBeChecked());
    expect(sent).toEqual({ enabled: true });
    expect(screen.getAllByText("Rp 12.000").length).toBeGreaterThan(0);
  });

  it("shows an error and keeps the draft when a choice fails", async () => {
    const user = userEvent.setup();
    handlers.set("PUT /api/checkout/damage-protection", json(500, { message: "SQLSTATE secret" }));
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("checkbox", { name: /damage protection/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not update damage protection. Please try again.");
    expect(screen.getByRole("checkbox", { name: /damage protection/ })).not.toBeChecked();
    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
  });

  it.each([
    ["Shipping Options", /Select Shipping/, "Shipping options are not available yet."],
    ["Vouchers", /Select Voucher/, "Vouchers are not available yet."],
  ])("the %s modal says it is not available yet when its endpoint is missing (404)", async (title, trigger, message) => {
    const user = userEvent.setup();
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: trigger }));

    expect(await within(dialog(title)).findByText(message)).toBeInTheDocument();
  });

  it("the Payment Methods modal says it is not available yet when its endpoint is missing (404)", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getAllByRole("button", { name: "See all" })[0]!);

    expect(await within(dialog("Payment Methods")).findByText("Payment methods are not available yet.")).toBeInTheDocument();
  });
});

describe("Pay Now", () => {
  const readyDraft = () => makeDraft({ address: addressDto, shipping, paymentMethod: payment });

  it("is enabled when the address, shipping and payment method are all set", () => {
    render(<CheckoutPage initialDraft={readyDraft()} />);

    for (const button of payButtons()) expect(button).toBeEnabled();
    expect(screen.queryByText(/to continue\./)).not.toBeInTheDocument();
  });

  it("stays on the page, with the general message, when the backend is unavailable (503)", async () => {
    const user = userEvent.setup();
    handlers.set("POST /api/checkout/orders", json(503, { message: "Maintenance" }));
    render(<CheckoutPage initialDraft={readyDraft()} />);

    await user.click(payButtons()[0]!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not place your order. Please try again.");
    expect(push).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("JNE Reguler (Rp 12.000)")).toBeInTheDocument();
    expect(payButtons()[0]).toBeEnabled();
  });

  it("shows a generic message for any other error, never the server's", async () => {
    const user = userEvent.setup();
    handlers.set("POST /api/checkout/orders", json(500, { message: "SQLSTATE 23505 duplicate key" }));
    render(<CheckoutPage initialDraft={readyDraft()} />);

    await user.click(payButtons()[0]!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not place your order. Please try again.");
    expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
  });

  it("says why the order was refused (for example the stock ran out)", async () => {
    const user = userEvent.setup();
    handlers.set("POST /api/checkout/orders", json(409, { code: "INSUFFICIENT_STOCK", message: "Only 2 left of Banana." }));
    render(<CheckoutPage initialDraft={readyDraft()} />);

    await user.click(payButtons()[0]!);

    expect(await screen.findByRole("alert")).toHaveTextContent("Only 2 left of Banana.");
  });

  it("shows the Order Received modal on 201, which a click outside cannot close", async () => {
    const user = userEvent.setup();
    handlers.set("POST /api/checkout/orders", json(201, { order: { id: 9, code: "ORD123" } }));
    render(<CheckoutPage initialDraft={readyDraft()} />);

    await user.click(payButtons()[0]!);

    const received = await screen.findByRole("dialog", { name: "Your order has been received" });
    expect(within(received).getByText("#ORD123")).toBeInTheDocument();
    expect(within(received).getByText("Thank you for your purchase")).toBeInTheDocument();
    expect(within(received).getByRole("link", { name: "Continue Shopping" })).toHaveAttribute("href", "/products");
    expect(within(received).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();

    // A click on the backdrop is a click on the dialog element itself.
    received.click();
    expect(screen.getByRole("dialog", { name: "Your order has been received" })).toBeInTheDocument();
  });

  it("closes the Order Received modal with Escape", async () => {
    const user = userEvent.setup();
    handlers.set("POST /api/checkout/orders", json(201, { order: { id: 9, code: "ORD123" } }));
    render(<CheckoutPage initialDraft={readyDraft()} />);

    await user.click(payButtons()[0]!);
    within(await screen.findByRole("dialog", { name: "Your order has been received" })).getByRole("link", { name: "Continue Shopping" }).focus();
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});

describe("quantity", () => {
  it("changes the quantity in the cart, then loads the repriced draft", async () => {
    const user = userEvent.setup();
    handlers.set("PATCH /api/cart/items/7", json(200, {
      items: [{ id: 7, quantity: 3, product: { id: 3, slug: "banana", name: "Banana Fruit from Bali", imageUrl: "/x.jpg", shop: { slug: "kebun", name: "Kebun Bali" } }, variant: { id: 9, label: "1 kg", unit: "kg", price: 2000, stock: 10 } }],
      itemCount: 3,
      subtotal: 6000,
    }));
    handlers.set("GET /api/checkout", json(200, draftDto({
      items: [{ ...draftDto().items[0]!, quantity: 3 }],
      summary: { ...draftDto().summary, productSubtotal: 6000, total: 18000 },
    })));
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));
    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("3");

    await waitFor(() => expect(screen.getAllByText("Rp 18.000").length).toBeGreaterThan(0));
    expect(requests.map((request) => `${request.method} ${request.url}`)).toEqual(["PATCH /api/cart/items/7", "GET /api/checkout"]);
  });

  it("goes back to the old quantity and shows an error when the cart refuses", async () => {
    const user = userEvent.setup();
    handlers.set("PATCH /api/cart/items/7", json(409, { message: "Only 2 left in stock." }));
    render(<CheckoutPage initialDraft={makeDraft()} />);

    await user.click(screen.getByRole("button", { name: "Increase quantity" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only 2 left in stock.");
    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("2");
  });
});
