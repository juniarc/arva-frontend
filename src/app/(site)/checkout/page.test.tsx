import { beforeEach, describe, expect, it, vi } from "vitest";
import { isValidElement } from "react";
import { makeDraft } from "@/features/checkout/checkout.fixture";
import { loadDraft, saveDraftAddress } from "@/features/checkout/data/checkout.loader";
import type { Address } from "@/features/checkout/types";
import { loadProfile } from "@/features/profile/data/profile.loader";
import { makeProfile } from "@/features/profile/profile.fixture";
import { requireUser } from "@/lib/auth/require-user";
import CheckoutRoute from "./page";

vi.mock("server-only", () => ({}));
vi.mock("@/features/checkout/components/CheckoutPage", () => ({ CheckoutPage: () => null }));
vi.mock("@/features/checkout/data/checkout.loader", () => ({ loadDraft: vi.fn(), saveDraftAddress: vi.fn() }));
vi.mock("@/features/profile/data/profile.loader", () => ({ loadProfile: vi.fn() }));
vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn(),
  // Like the real ones, these never return: they throw.
  redirectToLogin: (path: string) => {
    throw new Error(`REDIRECT:/login?redirect=${encodeURIComponent(path)}`);
  },
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const requireUserMock = vi.mocked(requireUser);
const loadMock = vi.mocked(loadDraft);
const saveMock = vi.mocked(saveDraftAddress);
const profileMock = vi.mocked(loadProfile);

/** The props the route hands to CheckoutPage. */
async function pageProps() {
  const element = await CheckoutRoute();
  if (!isValidElement(element)) throw new Error("expected an element");
  return element.props as { initialDraft: { address: Address | null }; suggestedAddress: Address | null };
}

const user = { token: "secret", user: { user_id: 1, username: "u", email: "u@x.co" } };

beforeEach(() => vi.clearAllMocks());

describe("/checkout route", () => {
  it("sends a guest (no token, or a token the backend rejects) to /login?redirect=/checkout", async () => {
    requireUserMock.mockRejectedValue(new Error("REDIRECT:/login?redirect=%2Fcheckout"));

    await expect(CheckoutRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fcheckout");
    expect(loadMock).not.toHaveBeenCalled();
  });

  it("sends the user to login when the draft answers 401", async () => {
    requireUserMock.mockResolvedValue(user);
    loadMock.mockResolvedValue({ status: "unauthorized" });

    await expect(CheckoutRoute()).rejects.toThrow("REDIRECT:/login?redirect=%2Fcheckout");
  });

  it("sends the user back to the cart, with a notice, when there is no draft", async () => {
    requireUserMock.mockResolvedValue(user);
    loadMock.mockResolvedValue({ status: "missing" });

    await expect(CheckoutRoute()).rejects.toThrow("REDIRECT:/cart?notice=checkout_expired");
  });

  it("loads the draft with the user's token", async () => {
    requireUserMock.mockResolvedValue(user);
    loadMock.mockResolvedValue({ status: "ok", draft: makeDraft({ address: null }) });
    profileMock.mockResolvedValue({ status: "ok", profile: makeProfile({ address: null }) });

    await CheckoutRoute();

    expect(loadMock).toHaveBeenCalledWith("secret");
  });
});

describe("/checkout route: the profile address", () => {
  const savedAddress = { label: "Home" } as Address;

  beforeEach(() => {
    requireUserMock.mockResolvedValue(user);
    loadMock.mockResolvedValue({ status: "ok", draft: makeDraft({ address: null }) });
  });

  it("copies a complete profile address into a new draft, so the user does not type it again", async () => {
    profileMock.mockResolvedValue({ status: "ok", profile: makeProfile() });
    const withAddress = { ...makeDraft({ address: null }), address: savedAddress };
    saveMock.mockResolvedValue(withAddress);

    const props = await pageProps();

    expect(profileMock).toHaveBeenCalledWith("secret");
    expect(saveMock).toHaveBeenCalledWith(
      "secret",
      expect.objectContaining({ label: "Home", recipientName: "Agus Setiawan", phone: "6281234567890", street: "Jl. Kebon Sirih No. 1" }),
    );
    expect(props.initialDraft).toBe(withAddress);
    expect(props.suggestedAddress).toBeNull();
  });

  it("does not touch a draft that already has an address", async () => {
    loadMock.mockResolvedValue({ status: "ok", draft: { ...makeDraft({ address: null }), address: savedAddress } });

    await pageProps();

    expect(profileMock).not.toHaveBeenCalled();
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("fills the form instead of saving when the profile has no phone", async () => {
    profileMock.mockResolvedValue({ status: "ok", profile: makeProfile({ user: { ...makeProfile().user, phone: null } }) });

    const props = await pageProps();

    expect(saveMock).not.toHaveBeenCalled();
    expect(props.initialDraft.address).toBeNull();
    expect(props.suggestedAddress).toMatchObject({ label: "Home", recipientName: "Agus Setiawan", phone: "" });
  });

  it("fills the form when saving the copy fails", async () => {
    profileMock.mockResolvedValue({ status: "ok", profile: makeProfile() });
    saveMock.mockResolvedValue(null);

    const props = await pageProps();

    expect(props.initialDraft.address).toBeNull();
    expect(props.suggestedAddress?.street).toBe("Jl. Kebon Sirih No. 1");
  });

  it("shows the empty form when the profile has no address or cannot be loaded", async () => {
    profileMock.mockResolvedValue({ status: "ok", profile: makeProfile({ address: null }) });
    expect((await pageProps()).suggestedAddress).toBeNull();

    profileMock.mockRejectedValue(new Error("backend down"));
    expect((await pageProps()).suggestedAddress).toBeNull();
    expect(saveMock).not.toHaveBeenCalled();
  });
});
