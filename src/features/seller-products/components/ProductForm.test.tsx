import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { parseOwnedProduct } from "../mappers/product-form.mapper";
import { ownedDto } from "../product.fixture";
import {
  INCOMPLETE_MESSAGE,
  NO_CATEGORIES_MESSAGE,
  NO_PHOTO_MESSAGE,
  ProductForm,
  UPDATED_MESSAGE,
  UPLOAD_FAILED_MESSAGE,
  UPLOADED_MESSAGE,
} from "./ProductForm";

type Handler = () => Response | Promise<Response>;
const handlers = new Map<string, Handler>();
const requests: { method: string; url: string; body: unknown }[] = [];
const json = (status: number, body: unknown) => () => new Response(JSON.stringify(body), { status });

const categories = [
  { id: "1", slug: "seeds", name: "Seeds", iconKey: "seeds" },
  { id: "2", slug: "fruits", name: "Fruits", iconKey: "fruits" },
];

beforeEach(() => {
  handlers.clear();
  requests.length = 0;
  vi.stubGlobal("fetch", async (url: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    requests.push({ method, url, body: init?.body });
    return (handlers.get(`${method} ${url}`) ?? json(404, { message: "Not found." }))();
  });
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

type User = ReturnType<typeof userEvent.setup>;

function renderForm(overrides: Partial<Parameters<typeof ProductForm>[0]> = {}) {
  const user = userEvent.setup({ applyAccept: false });
  const onCreated = vi.fn();
  const onSecondary = vi.fn();
  render(
    <>
      <h1 id="heading">Upload Product</h1>
      <ProductForm
        categories={categories}
        labelledBy="heading"
        secondaryLabel="Cancel"
        onSecondary={onSecondary}
        onCreated={onCreated}
        {...overrides}
      />
    </>,
  );
  return { user, onCreated, onSecondary };
}

const image = (bytes = 1000, type = "image/png") => new File([new Uint8Array(bytes)], "banana.png", { type });
const addPhotos = (user: User, files: File[]) => user.upload(screen.getByLabelText("Product photo files"), files);
const submit = (user: User) => user.click(screen.getByRole("button", { name: "Submit" }));

async function fillValid(user: User) {
  await addPhotos(user, [image()]);
  await user.type(screen.getByLabelText("Product Name"), "Banana Fruits from Bali");
  await user.type(screen.getByLabelText("Product Description"), "Sweet bananas.");
  await user.selectOptions(screen.getByLabelText("Category"), "2");
  await user.type(screen.getByLabelText("Tags / Keywords"), "Corn{Enter}Fresh,");
  await user.type(screen.getByLabelText("Variant Label"), "1 kg");
  await user.type(screen.getByLabelText("Price"), "10000");
  await user.type(screen.getByLabelText("Stock"), "30");
  await user.type(screen.getByLabelText("Package Weight"), "300");
  await user.type(screen.getByLabelText("Package Width"), "20");
  await user.type(screen.getByLabelText("Package Length"), "30");
  await user.type(screen.getByLabelText("Package Height"), "10");
  await user.type(screen.getByLabelText("Shipping Fee"), "1000");
}

describe("ProductForm: filling in", () => {
  it("shows the design's fields", () => {
    renderForm();
    for (const label of ["Product Name", "Product Description", "Category", "Tags / Keywords", "Variant Label", "Price", "Stock", "Unit", "Discount (%)", "Package Weight", "Package Width", "Package Length", "Package Height", "Shipping Fee"]) {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    }
    expect(screen.getByText("* Ratio will be 1:1")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Kilogram (kg)" })).toBeInTheDocument();
  });

  it("adds photos with a preview, removes them, and stops at 5", async () => {
    const { user } = renderForm();

    await addPhotos(user, [image(), image()]);
    expect(screen.getAllByRole("img", { name: /Photo \d/ })).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Remove photo 1" }));
    expect(screen.getAllByRole("img", { name: /Photo \d/ })).toHaveLength(1);

    await addPhotos(user, [image(), image(), image(), image()]);
    expect(screen.getAllByRole("img", { name: /Photo \d/ })).toHaveLength(5);
    expect(screen.queryByRole("button", { name: /Add Photo/ })).not.toBeInTheDocument();
  });

  it("refuses a photo in another format or over 2 MB before any upload", async () => {
    const { user } = renderForm();

    await addPhotos(user, [image(1000, "image/gif")]);
    expect(await screen.findByText("Choose a JPG, PNG or WebP image.")).toBeInTheDocument();

    await addPhotos(user, [image(2 * 1024 * 1024 + 1)]);
    expect(await screen.findByText("The photo must be 2 MB or smaller.")).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: /Photo \d/ })).not.toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it("adds tags with Enter or a comma, skips repeats, and removes them", async () => {
    const { user } = renderForm();
    const input = screen.getByLabelText("Tags / Keywords");

    await user.type(input, "Corn{Enter}corn,");
    expect(screen.getByText('"corn" is already added.')).toBeInTheDocument();

    await user.type(input, "Organic{Enter}");
    expect(screen.getByText("Corn")).toBeInTheDocument();
    expect(screen.getByText("Organic")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove tag Corn" }));
    expect(screen.queryByText("Corn")).not.toBeInTheDocument();
  });

  it("adds and removes variants", async () => {
    const { user } = renderForm();

    await user.click(screen.getByRole("button", { name: /Add Variant/ }));
    expect(screen.getAllByLabelText("Variant Label")).toHaveLength(2);

    await user.click(screen.getByRole("button", { name: "Remove variant 2" }));
    expect(screen.getAllByLabelText("Variant Label")).toHaveLength(1);
    // The last variant cannot be removed.
    expect(screen.queryByRole("button", { name: /Remove variant/ })).not.toBeInTheDocument();
  });

  it("keeps digits only in the price", async () => {
    const { user } = renderForm();
    await user.type(screen.getByLabelText("Price"), "Rp 1.000a");
    expect(screen.getByLabelText("Price")).toHaveValue("1000");
  });
});

describe("ProductForm: Submit", () => {
  it("with empty fields shows the messages, asks for a photo, and sends nothing", async () => {
    const { user } = renderForm();

    await submit(user);

    expect(await screen.findByText(INCOMPLETE_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(NO_PHOTO_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText("Product name is required.")).toBeInTheDocument();
    expect(screen.getByText("Choose a category.")).toBeInTheDocument();
    expect(screen.getByLabelText("Product Name")).toHaveAccessibleDescription(/Product name is required\./);
    expect(requests).toHaveLength(0);
  });

  it("without a photo asks for one, and sends nothing", async () => {
    const { user } = renderForm();
    await fillValid(user);
    await user.click(screen.getByRole("button", { name: "Remove photo 1" }));

    await submit(user);

    expect(await screen.findByText(NO_PHOTO_MESSAGE)).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it("uploads the product with its photos, shows the success message and reports the new product", async () => {
    handlers.set("POST /api/products", json(201, { product: { id: "42", slug: "banana-fruits-from-bali" } }));
    const { user, onCreated } = renderForm();
    await fillValid(user);

    await submit(user);

    expect(await screen.findByText(UPLOADED_MESSAGE)).toBeInTheDocument();
    expect(onCreated).toHaveBeenCalledWith({ id: "42", slug: "banana-fruits-from-bali" });
    const body = requests[0]?.body as FormData;
    expect(body.getAll("images")).toHaveLength(1);
    expect(JSON.parse(body.get("data") as string)).toMatchObject({
      name: "Banana Fruits from Bali",
      categoryId: "2",
      tags: ["Corn", "Fresh"],
      variants: [{ label: "1 kg", price: 10000, stock: 30, unit: "kg" }],
      discountPercent: null,
      shipping: { weightGrams: 300, widthCm: 20, lengthCm: 30, heightCm: 10, fee: 1000 },
    });
  });

  it("shows the Saving spinner while uploading", async () => {
    let finish: (response: Response) => void = () => undefined;
    handlers.set("POST /api/products", () => new Promise<Response>((resolve) => (finish = resolve)));
    const { user } = renderForm();
    await fillValid(user);

    await submit(user);

    expect(await screen.findByRole("status", { name: "Saving" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
    finish(new Response(JSON.stringify({ product: { id: "1", slug: "a" } }), { status: 201 }));
    await screen.findByText(UPLOADED_MESSAGE);
  });

  it("puts a server message under its field, and section messages under their section", async () => {
    handlers.set(
      "POST /api/products",
      json(400, { message: "Please fix the highlighted fields.", errors: { categoryId: "Choose a category.", images: "Photos must be JPG, PNG or WebP images." } }),
    );
    const { user } = renderForm();
    await fillValid(user);

    await submit(user);

    expect(await screen.findByText("Photos must be JPG, PNG or WebP images.")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toHaveAccessibleDescription("Choose a category.");
  });

  it("a server error shows the general message and keeps the values", async () => {
    handlers.set("POST /api/products", json(500, { message: "disk full" }));
    const { user, onCreated } = renderForm();
    await fillValid(user);

    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent(UPLOAD_FAILED_MESSAGE);
    expect(screen.getByLabelText("Product Name")).toHaveValue("Banana Fruits from Bali");
    expect(onCreated).not.toHaveBeenCalled();
  });

  it("the secondary button calls back and sends nothing", async () => {
    const { user, onSecondary } = renderForm({ secondaryLabel: "Skip for now" });

    await user.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(onSecondary).toHaveBeenCalled();
    expect(requests).toHaveLength(0);
  });

  it("says so and cannot be submitted when the categories could not be loaded", () => {
    renderForm({ categories: [] });

    expect(screen.getByText(NO_CATEGORIES_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeDisabled();
  });

  it("names the form after the page heading", () => {
    renderForm();
    expect(screen.getByRole("form", { name: "Upload Product" })).toBeInTheDocument();
  });
});

describe("ProductForm: editing", () => {
  const owned = parseOwnedProduct(ownedDto());
  const editMode = { kind: "edit" as const, productId: owned.id, values: owned.values, photos: owned.photos };

  it("starts with the product's values and photos, and an Edit button", () => {
    renderForm({ mode: editMode });

    expect(screen.getByLabelText("Product Name")).toHaveValue("Banana");
    expect(screen.getAllByLabelText("Variant Label").map((input) => (input as HTMLInputElement).value)).toEqual(["1 kg", "500 g"]);
    expect(screen.getByLabelText("Discount (%)")).toHaveValue("10");
    expect(screen.getAllByRole("img", { name: /Photo \d/ })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("saves the changes: kept photo ids, new photos, variant ids, and shows the success message", async () => {
    handlers.set("PUT /api/products/mine/42", json(200, { product: { id: "42", slug: "banana" } }));
    const { user, onCreated } = renderForm({ mode: editMode });

    await user.click(screen.getByRole("button", { name: "Remove photo 1" }));
    await addPhotos(user, [image()]);
    await user.click(screen.getByRole("button", { name: "Remove variant 2" }));
    await user.clear(screen.getByLabelText("Product Name"));
    await user.type(screen.getByLabelText("Product Name"), "Banana Premium");
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(await screen.findByText(UPDATED_MESSAGE)).toBeInTheDocument();
    expect(onCreated).toHaveBeenCalledWith({ id: "42", slug: "banana" });
    const body = requests.find((request) => request.method === "PUT")?.body as FormData;
    expect(body.getAll("images")).toHaveLength(1);
    expect(JSON.parse(body.get("data") as string)).toMatchObject({
      name: "Banana Premium",
      keepImageIds: ["12"],
      variants: [{ id: "1", label: "1 kg", price: 10000, stock: 3, unit: "kg" }],
    });
  });

  it("needs at least one photo when all saved ones are removed", async () => {
    const { user } = renderForm({ mode: editMode });

    await user.click(screen.getByRole("button", { name: "Remove photo 1" }));
    await user.click(screen.getByRole("button", { name: "Remove photo 1" }));
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(await screen.findByText(NO_PHOTO_MESSAGE)).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });
});
