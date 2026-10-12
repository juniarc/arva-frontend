import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ExpandableText } from "./ExpandableText";
import { LONG_DESCRIPTION } from "./product-page.fixture";

describe("ExpandableText", () => {
  it("switches between 'Read more description' and 'Hide description'", async () => {
    const user = userEvent.setup();
    render(<ExpandableText text={LONG_DESCRIPTION} />);

    const button = screen.getByRole("button", { name: "Read more description" });
    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);
    expect(screen.getByRole("button", { name: "Hide description" })).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByRole("button", { name: "Hide description" }));
    expect(screen.getByRole("button", { name: "Read more description" })).toBeInTheDocument();
  });

  it("limits long text to 3 lines until it is expanded", async () => {
    const user = userEvent.setup();
    render(<ExpandableText text={LONG_DESCRIPTION} />);
    const paragraph = screen.getByText(LONG_DESCRIPTION);

    expect(paragraph).toHaveClass("line-clamp-3");
    await user.click(screen.getByRole("button"));
    expect(paragraph).not.toHaveClass("line-clamp-3");
  });

  it("shows short text in full with no button", () => {
    render(<ExpandableText text="Short text." />);

    expect(screen.getByText("Short text.")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
