import { describe, expect, it, vi } from "vitest";
import { continueDiscordWork } from "@/lib/discord-background.server";

describe("Discord deferred actions", () => {
  it("keeps the action alive with the hosting execution context", async () => {
    const waitUntil = vi.fn();
    const request = Object.assign(new Request("https://example.com"), { waitUntil });
    continueDiscordWork(request, Promise.resolve("done"));
    expect(waitUntil).toHaveBeenCalledOnce();
    await expect(waitUntil.mock.calls[0]?.[0]).resolves.toBe("done");
  });
});