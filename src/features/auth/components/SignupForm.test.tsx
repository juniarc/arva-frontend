import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignupForm } from "./SignupForm";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

const registerMock = vi.fn();
vi.mock("../api/auth", () => ({ register: (...args: unknown[]) => registerMock(...args) }));

type User = ReturnType<typeof userEvent.setup>;

async function fillForm(
  user: User,
  values: { username?: string; email?: string; password?: string; confirm?: string },
) {
  if (values.username) await user.type(screen.getByLabelText("Username"), values.username);
  if (values.email) await user.type(screen.getByLabelText("Email"), values.email);
  if (values.password) await user.type(screen.getByLabelText("Password"), values.password);
  if (values.confirm) await user.type(screen.getByLabelText("Confirm password"), values.confirm);
}

const submit = (user: User) => user.click(screen.getByRole("button", { name: "Sign Up" }));

const validValues = {
  username: "farmer1",
  email: "farmer@example.com",
  password: "password1",
  confirm: "password1",
};

describe("SignupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows required messages for empty fields", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await submit(user);

    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(screen.getByText("Please confirm your password")).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it("shows a message for an invalid email", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await fillForm(user, { ...validValues, email: "not-an-email" });
    await submit(user);

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
  });

  it("requires a number in the password", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await fillForm(user, { ...validValues, password: "onlyletters", confirm: "onlyletters" });
    await submit(user);

    expect(await screen.findByText("Password must contain at least one number")).toBeInTheDocument();
  });

  it("shows a message when passwords do not match", async () => {
    const user = userEvent.setup();
    render(<SignupForm />);

    await fillForm(user, { ...validValues, confirm: "different1" });
    await submit(user);

    expect(await screen.findByText("Passwords do not match")).toBeInTheDocument();
  });

  it("disables the button while submitting", async () => {
    const user = userEvent.setup();
    registerMock.mockReturnValue(new Promise(() => {}));
    render(<SignupForm />);

    await fillForm(user, validValues);
    await submit(user);

    const button = await screen.findByRole("button", { name: "Sign Up" });
    await waitFor(() => expect(button).toBeDisabled());
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("shows a duplicate email error next to the email field, not as an alert", async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue({
      ok: false,
      error: { code: "conflict", message: "Email already registered", field: "email" },
    });
    render(<SignupForm />);

    await fillForm(user, validValues);
    await submit(user);

    const error = await screen.findByText("Email already registered");
    expect(error).toHaveAttribute("id", "email-error");
    expect(screen.getByLabelText("Email")).toHaveAttribute("aria-describedby", "email-error");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows an alert for errors that do not belong to a field", async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue({
      ok: false,
      error: { code: "network", message: "Unable to reach the server. Check your connection and try again." },
    });
    render(<SignupForm />);

    await fillForm(user, validValues);
    await submit(user);

    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to reach the server");
  });

  it("redirects to /login with a success message after sign-up", async () => {
    const user = userEvent.setup();
    registerMock.mockResolvedValue({ ok: true, data: { user: {} } });
    render(<SignupForm />);

    await fillForm(user, validValues);
    await submit(user);

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login?success=account_created"));
  });
});
