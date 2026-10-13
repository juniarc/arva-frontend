import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { ModalShell } from "./ModalShell";

function Harness({ dismissOnBackdrop = true, showCloseButton = true }: { dismissOnBackdrop?: boolean; showCloseButton?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <ModalShell
        open={open}
        title="Shipping Options"
        onClose={() => setOpen(false)}
        dismissOnBackdrop={dismissOnBackdrop}
        showCloseButton={showCloseButton}
      >
        <button>Inside</button>
      </ModalShell>
    </>
  );
}

describe("ModalShell", () => {
  it("is a modal dialog with an accessible title", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open" }));

    const dialog = screen.getByRole("dialog", { name: "Shipping Options" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("locks body scroll while open and restores it after", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(document.body.style.overflow).not.toBe("hidden"));
  });

  it("closes with the X button and returns the focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Open" });

    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Close" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });

  it("closes with Escape", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    screen.getByRole("button", { name: "Inside" }).focus();
    await user.keyboard("{Escape}");

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("closes on a click outside by default", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    screen.getByRole("dialog").click();

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("ignores a click outside when dismissOnBackdrop is false, and can hide the X button", async () => {
    const user = userEvent.setup();
    render(<Harness dismissOnBackdrop={false} showCloseButton={false} />);

    await user.click(screen.getByRole("button", { name: "Open" }));
    screen.getByRole("dialog").click();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});
