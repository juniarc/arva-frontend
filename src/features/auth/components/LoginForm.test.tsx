import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./LoginForm";

const replace = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh, push: vi.fn() }) }));

const loginMock = vi.fn();
vi.mock("../api/auth", () => ({ login: (...args: unknown[]) => loginMock(...args) }));

async function fillAndSubmit(user: ReturnType<typeof userEvent.setup>, username: string, password: string) {
  await user.type(screen.getByLabelText("Username"), username);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Login" }));
}

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows required messages for empty fields and does not call the API", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it("links the error message to its input", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole("button", { name: "Login" }));

    const input = screen.getByLabelText("Username");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "username-error");
  });

  it("shows a message for a short password", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await fillAndSubmit(user, "farmer1", "short");

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
  });

  it("disables the button and shows a busy state while submitting", async () => {
    const user = userEvent.setup();
    loginMock.mockReturnValue(new Promise(() => {})); // never resolves
    render(<LoginForm />);

    await fillAndSubmit(user, "farmer1", "password1");

    const button = await screen.findByRole("button", { name: "Login" });
    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("shows the API error in an alert", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({
      ok: false,
      error: { code: "invalid_credentials", message: "Invalid username or password." },
    });
    render(<LoginForm />);

    await fillAndSubmit(user, "farmer1", "password1");

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password.");
    expect(replace).not.toHaveBeenCalled();
  });

  it("redirects to a safe redirect path on success", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({ ok: true, data: { user: {} } });
    render(<LoginForm redirectTo="/cart" />);

    await fillAndSubmit(user, "farmer1", "password1");

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/cart"));
  });

  it("ignores an unsafe redirect path", async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({ ok: true, data: { user: {} } });
    render(<LoginForm redirectTo="//evil.com" />);

    await fillAndSubmit(user, "farmer1", "password1");

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("shows the success banner when a message is passed", () => {
    render(<LoginForm successMessage="Account created. Please log in." />);

    expect(screen.getByRole("status")).toHaveTextContent("Account created. Please log in.");
  });

  it("toggles password visibility", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const input = screen.getByLabelText("Password");
    expect(input).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeInTheDocument();
  });

  it("shows the Google button as disabled", () => {
    render(<LoginForm />);

    expect(screen.getByRole("button", { name: "Login with Google" })).toBeDisabled();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
  });
});
