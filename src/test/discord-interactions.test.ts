import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  verifyDiscordSignature: vi.fn(async () => true),
  isGuildOwner: vi.fn(async () => false),
  enterPrivateEye: vi.fn(async () => {}),
  lookupIp: vi.fn(async () => "## **País:**\nBrasil"),
  sendEyePanel: vi.fn(async () => {}),
}));
vi.mock("@/lib/discord.server", () => ({ ...mocks, loadTemplate: vi.fn(), postRules: vi.fn() }));
vi.mock("@/lib/discord-ip-media.server", () => ({ enterPrivateEye: mocks.enterPrivateEye }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: unknown) => options }));
import { Route } from "@/routes/api/public/discord/interactions";

const handle = (Route as unknown as { server: { handlers: { POST: (input: { request: Request }) => Promise<Response> } } }).server.handlers.POST;
const base = { application_id: "app", token: "interaction-token", guild_id: "guild", member: { user: { id: "12345", username: "Pessoa" } } };
async function interaction(data: object) {
  const work: Promise<unknown>[] = [];
  const request = Object.assign(new Request("https://example.com/api/public/discord/interactions", {
    method: "POST", body: JSON.stringify({ ...base, ...data }),
  }), { waitUntil: (promise: Promise<unknown>) => work.push(promise) });
  const response = await handle({ request });
  const payload = await response.json();
  await Promise.all(work);
  return payload;
}
afterEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe("Discord IP interactions", () => {
  it("acknowledges entry privately and starts the private eye sequence", async () => {
    expect(await interaction({ type: 3, data: { custom_id: "ip_open" } })).toEqual({ type: 5, data: { flags: 64 } });
    expect(mocks.enterPrivateEye).toHaveBeenCalledWith("https://discord.com/api/v10/webhooks/app/interaction-token", "12345");
  });
  it("returns the IP result only in a private deferred response", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await interaction({ type: 5, data: { custom_id: "ip_modal", components: [{ components: [{ value: "8.8.8.8" }] }] } })).toEqual({ type: 5, data: { flags: 64 } });
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toEqual({ content: "## **País:**\nBrasil", allowed_mentions: { parse: [] } });
  });
  it("refuses an owner-only command for a non-owner without posting a portal", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(null, { status: 204 })));
    await interaction({ type: 2, data: { name: "ip-embed" } });
    expect(mocks.isGuildOwner).toHaveBeenCalledWith("guild", "12345");
    expect(mocks.sendEyePanel).not.toHaveBeenCalled();
  });
});