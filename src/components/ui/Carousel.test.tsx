import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Carousel } from "./Carousel";

const slides = [
  { id: "a", content: <p>Slide A</p> },
  { id: "b", content: <p>Slide B</p> },
  { id: "c", content: <p>Slide C</p> },
];

function activeSlideText(container: HTMLElement): string | null {
  return container.querySelector('[aria-roledescription="slide"][aria-hidden="false"]')?.textContent ?? null;
}

describe("Carousel", () => {
  it("starts on the first slide", () => {
    const { container } = render(<Carousel slides={slides} label="Offers" />);

    expect(activeSlideText(container)).toBe("Slide A");
  });

  it("advances with the next button and wraps around", async () => {
    const user = userEvent.setup();
    const { container } = render(<Carousel slides={slides} label="Offers" />);

    await user.click(screen.getByRole("button", { name: "Next slide" }));
    expect(activeSlideText(container)).toBe("Slide B");

    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    await user.click(screen.getByRole("button", { name: "Previous slide" }));
    expect(activeSlideText(container)).toBe("Slide C");
  });

  it("changes slide with the arrow keys", () => {
    const { container } = render(<Carousel slides={slides} label="Offers" />);
    const region = screen.getByRole("region", { name: "Offers" });

    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(activeSlideText(container)).toBe("Slide B");

    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(activeSlideText(container)).toBe("Slide A");
  });

  it("jumps to a slide from its dot", async () => {
    const user = userEvent.setup();
    const { container } = render(<Carousel slides={slides} label="Offers" />);

    await user.click(screen.getByRole("button", { name: "Go to slide 3" }));
    expect(activeSlideText(container)).toBe("Slide C");
  });
});
