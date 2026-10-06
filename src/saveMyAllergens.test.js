// @ts-nocheck
// F2-2: allergierne gemmes med ét kald (én transaktion), og en fejl kastes videre.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveMyAllergens } from "./saveMyAllergens.js";

beforeEach(() => { global.fetch = vi.fn(); });

describe("saveMyAllergens", () => {
  it("sender faste og egne allergier i ét kald til RPC'en", async () => {
    global.fetch.mockResolvedValueOnce({ ok: true, status: 204, text: async () => "" });
    await saveMyAllergens({ accessToken: "tok", allergens: ["aeg"], custom: ["jordbær"] });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain("/rest/v1/rpc/save_my_allergens");
    expect(JSON.parse(opts.body)).toEqual({ p_allergens: ["aeg"], p_custom: ["jordbær"] });
  });

  it("kaster videre, når gemningen fejler", async () => {
    global.fetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => "{}" });
    await expect(saveMyAllergens({ accessToken: "tok", allergens: [], custom: [] })).rejects.toThrow();
  });

  it("bruger den gamle vej, når RPC'en ikke findes endnu (404)", async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: false, status: 404, text: async () => '{"code":"PGRST202"}' })
      .mockResolvedValueOnce({ ok: true, status: 204, text: async () => "" })
      .mockResolvedValueOnce({ ok: true, status: 201, text: async () => "" });
    await saveMyAllergens({ accessToken: "tok", userId: "u1", allergens: ["aeg"], custom: [] });
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(global.fetch.mock.calls[1][0]).toContain("/rest/v1/user_allergens?user_id=eq.u1");
    expect(global.fetch.mock.calls[1][1].method).toBe("DELETE");
    expect(JSON.parse(global.fetch.mock.calls[2][1].body)).toEqual([{ user_id: "u1", allergen: "aeg", type: "allergen" }]);
  });
});
