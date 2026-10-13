import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeProfile, profileDto } from "../profile.fixture";
import { SUCCESS_HIDE_MS } from "../state/useProfileState";
import { ProfilePage } from "./ProfilePage";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }) }));

/** The browser only calls our own /api routes, so a fake fetch that answers them is all the "backend" we need. */
type Handler = (request: { body: unknown }) => Response | Promise<Response>;
const handlers = new Map<string, Handler>();
const requests: { method: string; url: string; body: unknown }[] = [];
const json = (status: number, body: unknown) => () => new Response(JSON.stringify(body), { status });

const SUCCESS = "Profile Updated Successfully";
const FAILURE = "Profile update failed. Please try again.";

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
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

afterEach(() => vi.useRealTimers());

const puts = () => requests.filter((request) => request.method === "PUT");

const regionHandlers = () => {
  handlers.set("GET /api/regions/provinces", json(200, { items: [{ id: "31", name: "DKI Jakarta" }, { id: "32", name: "Jawa Barat" }] }));
  handlers.set("GET /api/regions/provinces/31/cities", json(200, { items: [{ id: "31.71", name: "Kota Administrasi Jakarta Pusat" }] }));
  handlers.set("GET /api/regions/provinces/32/cities", json(200, { items: [{ id: "32.73", name: "Kota Bandung" }] }));
  handlers.set("GET /api/regions/cities/31.71/districts", json(200, { items: [{ id: "31.71.07", name: "Tanah Abang" }] }));
  handlers.set("GET /api/regions/districts/31.71.07/sub-districts", json(200, { items: [{ id: "31.71.07.1001", name: "Gelora" }] }));
};

const renderPage = (profile = makeProfile()) => {
  const user = userEvent.setup();
  render(<ProfilePage initialProfile={profile} />);
  return user;
};

const renamed = (name: string) => json(200, profileDto({ user: { ...profileDto().user, name } }));

async function editInfo(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Edit profile information" }));
}

describe("ProfilePage: read mode", () => {
  it("shows the profile and the address from the server", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "My Profile" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Profile Info" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Address" })).toBeInTheDocument();
    for (const text of ["Agus Setiawan", "agus_01", "agus@example.com", "+6281234567890", "Jl. Kebon Sirih No. 1", "Gelora", "Tanah Abang", "DKI Jakarta", "10270"]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  it("says so when there is no address and no phone", () => {
    renderPage(makeProfile({ address: null, user: { ...makeProfile().user, phone: null } }));

    expect(screen.getByText("You have not added an address yet.")).toBeInTheDocument();
    expect(screen.getByText("Not set")).toBeInTheDocument();
  });

  it("shows a placeholder without a photo", () => {
    renderPage();
    expect(screen.getByRole("img", { name: "No profile photo" })).toBeInTheDocument();
  });
});

describe("ProfilePage: Profile Info", () => {
  it("Edit Profile switches only that section to edit mode", async () => {
    const user = renderPage();

    await editInfo(user);

    expect(screen.getByLabelText("Name")).toHaveValue("Agus Setiawan");
    expect(screen.getByLabelText("Username")).toHaveValue("agus_01");
    expect(screen.getByLabelText("Email")).toHaveValue("agus@example.com");
    expect(screen.getByLabelText("Phone Number")).toHaveValue("+6281234567890");
    expect(screen.getByRole("button", { name: "Save profile information" })).toBeInTheDocument();
    // The address is still in read mode.
    expect(screen.getByRole("button", { name: "Edit address" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Zip Code")).not.toBeInTheDocument();
  });

  it("Cancel restores the values and makes no API call", async () => {
    const user = renderPage();
    await editInfo(user);
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Someone Else");

    await user.click(screen.getByRole("button", { name: "Cancel editing profile information" }));

    expect(screen.getByText("Agus Setiawan")).toBeInTheDocument();
    expect(screen.queryByText("Someone Else")).not.toBeInTheDocument();
    expect(requests).toHaveLength(0);

    await editInfo(user);
    expect(screen.getByLabelText("Name")).toHaveValue("Agus Setiawan");
  });

  it("Save with an empty name shows the message and makes no API call", async () => {
    const user = renderPage();
    await editInfo(user);
    await user.clear(screen.getByLabelText("Name"));

    await user.click(screen.getByRole("button", { name: "Save profile information" }));

    const name = screen.getByLabelText("Name");
    expect(await screen.findByText("Field cannot be empty.")).toBeInTheDocument();
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(name).toHaveAccessibleDescription("Field cannot be empty.");
    expect(requests).toHaveLength(0);
  });

  it("Save with an invalid email or phone shows the messages", async () => {
    const user = renderPage();
    await editInfo(user);
    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.clear(screen.getByLabelText("Phone Number"));
    await user.type(screen.getByLabelText("Phone Number"), "12ab");

    await user.click(screen.getByRole("button", { name: "Save profile information" }));

    expect(await screen.findByText("Invalid email format.")).toBeInTheDocument();
    expect(screen.getByText("Invalid phone number format.")).toBeInTheDocument();
    expect(puts()).toHaveLength(0);
  });

  it("checks again on blur after the first Save attempt", async () => {
    const user = renderPage();
    await editInfo(user);
    await user.clear(screen.getByLabelText("Name"));
    await user.click(screen.getByRole("button", { name: "Save profile information" }));
    expect(await screen.findByText("Field cannot be empty.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Name"), "Agus");
    await user.tab();

    await waitFor(() => expect(screen.queryByText("Field cannot be empty.")).not.toBeInTheDocument());
  });

  it("a successful save shows the success message, replaces the values and returns to read mode", async () => {
    handlers.set("PUT /api/profile", renamed("New Name"));
    const user = renderPage();
    await editInfo(user);
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "  New Name ");

    await user.click(screen.getByRole("button", { name: "Save profile information" }));

    expect(await screen.findByRole("status", { name: "" })).toHaveTextContent(SUCCESS);
    expect(screen.getByText("New Name")).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit profile information" })).toBeInTheDocument();
    expect(puts()).toEqual([
      expect.objectContaining({
        url: "/api/profile",
        body: { name: "New Name", username: "agus_01", email: "agus@example.com", phone: "+6281234567890" },
      }),
    ]);
  });

  it("sends null when the phone number is cleared", async () => {
    handlers.set("PUT /api/profile", json(200, profileDto({ user: { ...profileDto().user, phone: null } })));
    const user = renderPage();
    await editInfo(user);
    await user.clear(screen.getByLabelText("Phone Number"));

    await user.click(screen.getByRole("button", { name: "Save profile information" }));

    await screen.findByText(SUCCESS);
    expect(puts()[0]?.body).toMatchObject({ phone: null });
  });

  it("hides the success message after 4 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    handlers.set("PUT /api/profile", renamed("New Name"));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ProfilePage initialProfile={makeProfile()} />);
    await editInfo(user);
    await user.click(screen.getByRole("button", { name: "Save profile information" }));
    await screen.findByText(SUCCESS);

    act(() => {
      vi.advanceTimersByTime(SUCCESS_HIDE_MS);
    });

    expect(screen.queryByText(SUCCESS)).not.toBeInTheDocument();
  });

  it("a 409 for a taken username keeps the form open and shows the message under Username", async () => {
    handlers.set("PUT /api/profile", json(409, { message: "This username is already taken.", field: "username" }));
    const user = renderPage();
    await editInfo(user);

    await user.click(screen.getByRole("button", { name: "Save profile information" }));

    const username = screen.getByLabelText("Username");
    expect(await screen.findByText("This username is already taken.")).toBeInTheDocument();
    expect(username).toHaveAccessibleDescription("This username is already taken.");
    expect(screen.getByRole("button", { name: "Save profile information" })).toBeEnabled();
    expect(screen.queryByText(FAILURE)).not.toBeInTheDocument();
  });

  it("a 409 for a taken email shows the message under Email", async () => {
    handlers.set("PUT /api/profile", json(409, { message: "This email is already used.", field: "email" }));
    const user = renderPage();
    await editInfo(user);

    await user.click(screen.getByRole("button", { name: "Save profile information" }));

    expect(await screen.findByText("This email is already used.")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription("This email is already used.");
  });

  it("a 400 with field errors shows each message under its field", async () => {
    handlers.set("PUT /api/profile", json(400, { message: "Invalid.", errors: { name: "Name is not allowed.", phone: "Phone is not valid." } }));
    const user = renderPage();
    await editInfo(user);

    await user.click(screen.getByRole("button", { name: "Save profile information" }));

    expect(await screen.findByText("Name is not allowed.")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone Number")).toHaveAccessibleDescription("Phone is not valid.");
  });

  it.each([
    ["a server error", () => json(500, { message: "SQLSTATE secret" })],
    ["a 404 (not built yet)", () => json(404, { message: "Not found." })],
    ["an answer without a user", () => json(200, { address: null })],
  ])("%s keeps edit mode and the typed values, and shows the failure message", async (_name, handler) => {
    handlers.set("PUT /api/profile", handler());
    const user = renderPage();
    await editInfo(user);
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Typed Name");

    await user.click(screen.getByRole("button", { name: "Save profile information" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(FAILURE);
    expect(screen.getByLabelText("Name")).toHaveValue("Typed Name");
    expect(screen.queryByText(/SQLSTATE|Not found/)).not.toBeInTheDocument();
  });

  it("shows the failure message when the network fails", async () => {
    handlers.set("PUT /api/profile", () => {
      throw new TypeError("fetch failed");
    });
    const user = renderPage();
    await editInfo(user);

    await user.click(screen.getByRole("button", { name: "Save profile information" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(FAILURE);
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
  });

  it("covers the section with a Saving spinner and disables everything while saving", async () => {
    let finish: (response: Response) => void = () => undefined;
    handlers.set("PUT /api/profile", () => new Promise<Response>((resolve) => (finish = resolve)));
    const user = renderPage();
    await editInfo(user);

    await user.click(screen.getByRole("button", { name: "Save profile information" }));

    expect(await screen.findByRole("status", { name: "Saving" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save profile information" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel editing profile information" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Edit address" })).toBeDisabled();

    await act(async () => finish(new Response(JSON.stringify(profileDto()), { status: 200 })));
    await waitFor(() => expect(screen.queryByRole("status", { name: "Saving" })).not.toBeInTheDocument());
  });
});

describe("ProfilePage: Address", () => {
  it("Edit Address switches only that section to edit mode, with the saved regions chosen", async () => {
    regionHandlers();
    const user = renderPage();

    await user.click(screen.getByRole("button", { name: "Edit address" }));

    expect(screen.getByLabelText("Address Street")).toHaveValue("Jl. Kebon Sirih No. 1");
    expect(screen.getByLabelText("Zip Code")).toHaveValue("10270");
    await waitFor(() => expect(screen.getByLabelText("Province")).toHaveValue("31"));
    expect(screen.getByLabelText("City")).toHaveValue("31.71");
    expect(screen.getByLabelText("District")).toHaveValue("31.71.07");
    expect(screen.getByLabelText("Sub-district")).toHaveValue("31.71.07.1001");
    expect(screen.getByRole("button", { name: "Edit profile information" })).toBeInTheDocument();
  });

  it("shows 'Address options are not available yet.' and keeps Save disabled when the region endpoints return 404", async () => {
    const user = renderPage();

    await user.click(screen.getByRole("button", { name: "Edit address" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Address options are not available yet.");
    expect(screen.getByRole("button", { name: "Save address" })).toBeDisabled();
  });

  it("changing the province clears the city, district and sub-district", async () => {
    regionHandlers();
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "Edit address" }));
    await waitFor(() => expect(screen.getByLabelText("Sub-district")).toHaveValue("31.71.07.1001"));

    await user.selectOptions(screen.getByLabelText("Province"), "32");

    expect(screen.getByLabelText("City")).toHaveValue("");
    expect(screen.getByLabelText("District")).toHaveValue("");
    expect(screen.getByLabelText("Sub-district")).toHaveValue("");
    expect(screen.getByLabelText("District")).toBeDisabled();
    expect(screen.getByLabelText("District")).toHaveAccessibleDescription("Choose a city first.");
    await screen.findByRole("option", { name: "Kota Bandung" });
  });

  it("changing the city clears the district and sub-district but keeps the province", async () => {
    regionHandlers();
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "Edit address" }));
    await waitFor(() => expect(screen.getByLabelText("Sub-district")).toHaveValue("31.71.07.1001"));

    await user.selectOptions(screen.getByLabelText("City"), "");

    expect(screen.getByLabelText("Province")).toHaveValue("31");
    expect(screen.getByLabelText("District")).toHaveValue("");
    expect(screen.getByLabelText("Sub-district")).toHaveValue("");
  });

  it("a zip code takes digits only, at most 5", async () => {
    regionHandlers();
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "Edit address" }));

    await user.clear(screen.getByLabelText("Zip Code"));
    await user.type(screen.getByLabelText("Zip Code"), "1a2b3c456789");

    expect(screen.getByLabelText("Zip Code")).toHaveValue("12345");
  });

  it("Save without a sub-district shows the message and makes no API call", async () => {
    regionHandlers();
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "Edit address" }));
    await waitFor(() => expect(screen.getByLabelText("Sub-district")).toHaveValue("31.71.07.1001"));
    await user.selectOptions(screen.getByLabelText("District"), "");

    await user.click(screen.getByRole("button", { name: "Save address" }));

    expect(await screen.findByText("Select a district")).toBeInTheDocument();
    expect(screen.getByText("Select a sub-district")).toBeInTheDocument();
    expect(puts()).toHaveLength(0);
  });

  it("a successful save sends the ids only, shows success and returns to read mode", async () => {
    regionHandlers();
    const saved = profileDto();
    handlers.set("PUT /api/profile/address", json(200, { ...saved, address: { ...saved.address, zipCode: "12345" } }));
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "Edit address" }));
    await waitFor(() => expect(screen.getByLabelText("Sub-district")).toHaveValue("31.71.07.1001"));
    await user.clear(screen.getByLabelText("Zip Code"));
    await user.type(screen.getByLabelText("Zip Code"), "12345");

    await user.click(screen.getByRole("button", { name: "Save address" }));

    expect(await screen.findByText(SUCCESS)).toBeInTheDocument();
    expect(screen.getByText("12345")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit address" })).toBeInTheDocument();
    expect(puts().map((request) => request.url)).toEqual(["/api/profile/address"]);
    expect(puts()[0]?.body).toEqual({
      street: "Jl. Kebon Sirih No. 1",
      province: { id: "31" },
      city: { id: "31.71" },
      district: { id: "31.71.07" },
      subDistrict: { id: "31.71.07.1001" },
      zipCode: "12345",
    });
    expect(requests.some((request) => request.url.includes("/api/checkout"))).toBe(false);
  });

  it("a failed save keeps edit mode and the typed street, and shows the failure message", async () => {
    regionHandlers();
    handlers.set("PUT /api/profile/address", json(500, { message: "boom" }));
    const user = renderPage();
    await user.click(screen.getByRole("button", { name: "Edit address" }));
    await waitFor(() => expect(screen.getByLabelText("Sub-district")).toHaveValue("31.71.07.1001"));
    await user.clear(screen.getByLabelText("Address Street"));
    await user.type(screen.getByLabelText("Address Street"), "New street");

    await user.click(screen.getByRole("button", { name: "Save address" }));

    expect(await screen.findByText(FAILURE)).toBeInTheDocument();
    expect(screen.getByLabelText("Address Street")).toHaveValue("New street");
  });

  it("counts the street characters", async () => {
    regionHandlers();
    const user = renderPage(makeProfile({ address: null }));
    await user.click(screen.getByRole("button", { name: "Edit address" }));

    await user.type(screen.getByLabelText("Address Street"), "Jl. A");

    expect(screen.getByText("5/200")).toBeInTheDocument();
  });
});

describe("ProfilePage: photo", () => {
  const pick = async (file: File) => {
    // applyAccept is off so the page's own check is what is tested.
    await userEvent.setup({ applyAccept: false }).upload(screen.getByLabelText("Profile photo file"), file);
  };
  const image = (bytes: number, type: string) => new File([new Uint8Array(bytes)], "me", { type });

  it("shows an error for another format before any upload", async () => {
    renderPage();
    await pick(image(100, "image/gif"));

    expect(await screen.findByText("Choose a JPG, PNG or WebP image.")).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it("shows an error for a file over 2 MB before any upload", async () => {
    renderPage();
    await pick(image(2 * 1024 * 1024 + 1, "image/png"));

    expect(await screen.findByText("The photo must be 2 MB or smaller.")).toBeInTheDocument();
    expect(requests).toHaveLength(0);
  });

  it("uploads a valid image and shows the new photo", async () => {
    const photoUrl = "https://cdn.test/me.png";
    handlers.set("PUT /api/profile/photo", json(200, profileDto({ user: { ...profileDto().user, photoUrl } })));
    renderPage();
    await pick(image(1000, "image/png"));

    expect(await screen.findByText(SUCCESS)).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Your profile photo" })).toHaveAttribute("src", photoUrl);
    expect(puts()[0]?.body).toBeInstanceOf(FormData);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("shows the failure message on a 404 and does not change the displayed photo", async () => {
    renderPage();
    await pick(image(1000, "image/png"));

    expect(await screen.findByRole("alert")).toHaveTextContent(FAILURE);
    expect(screen.getByRole("img", { name: "No profile photo" })).toBeInTheDocument();
    expect(screen.queryByRole("img", { name: "Your profile photo" })).not.toBeInTheDocument();
  });

  it("has a Change Profile Photo button", () => {
    renderPage();
    expect(within(document.body).getByRole("button", { name: "Change Profile Photo" })).toBeEnabled();
  });
});
