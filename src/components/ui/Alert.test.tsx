import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
  it("renders the success variant as a polite status", () => {
    render(<Alert variant="success" message="Saved." />);

    const alert = screen.getByRole("status");
    expect(alert).toHaveTextContent("Saved.");
    expect(alert).toHaveAttribute("aria-live", "polite");
  });

  it("renders the error variant as an alert", () => {
    render(<Alert variant="error" message="Failed." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Failed.");
  });

  it("shows a close button only when onClose is given", async () => {
    const onClose = vi.fn();
    const { rerender } = render(<Alert variant="success" message="Saved." />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    rerender(<Alert variant="success" message="Saved." onClose={onClose} />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Dismiss message" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
