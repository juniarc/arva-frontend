import { beforeEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "./http";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});

const init = () => fetchMock.mock.calls[0]?.[1] as RequestInit;

describe("requestJson", () => {
  it("sends an object as JSON", async () => {
    await requestJson("/x", { method: "PUT", body: { a: 1 } });

    expect(init().body).toBe('{"a":1}');
    expect((init().headers as Record<string, string>)["Content-Type"]).toBe("application/json");
  });

  it("sends a form as multipart: no JSON content type, so fetch can add the boundary", async () => {
    const form = new FormData();
    form.append("photo", new File(["x"], "me.png", { type: "image/png" }));

    await requestJson("/x", { method: "PUT", body: form });

    expect(init().body).toBe(form);
    expect((init().headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });
});
