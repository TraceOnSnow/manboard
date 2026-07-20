import { afterEach, describe, expect, it, vi } from "vitest";

import { api } from "./board";

describe("board API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the same-origin API path", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    });
    vi.stubGlobal("fetch", fetchMock);

    await api.listBoxes();

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/boxes",
      expect.objectContaining({ headers: { "Content-Type": "application/json" } }),
    );
  });
});
