import { afterEach, describe, expect, it, vi } from "vitest";
import { TEMPLATE, TEMPLATE_NAME } from "@/lib/discord-template";
import { loadTemplate } from "@/lib/discord.server";

vi.mock("@/assets/eye.gif?inline", () => ({ default: "data:image/gif;base64,R0lGODlh" }));

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Panela do Caos reconciliation", () => {
  it("reuses legacy channel IDs and never deletes them on a normal load", async () => {
    vi.stubEnv("DISCORD_BOT_TOKEN", "test-token");
    const channels = TEMPLATE.flatMap((block, bi) => [
      { id: `cat-${bi}`, name: block.aliases?.[0] ?? block.category, type: 4, position: bi },
      ...block.channels.map((ch, ci) => ({ id: `ch-${bi}-${ci}`, name: ch.aliases?.[0] ?? ch.name,
        type: ch.type, parent_id: `cat-${bi}`, position: ci, topic: ch.topic, user_limit: ch.user_limit })),
    ]);
    const calls: { path: string; method: string; body: any }[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      const path = url.replace("https://discord.com/api/v10", "");
      const method = init?.method ?? "GET";
      const body = init?.body ? JSON.parse(String(init.body)) : null;
      calls.push({ path, method, body });
      if (method === "GET") return new Response(JSON.stringify(path.endsWith("/channels") ? channels : { name: TEMPLATE_NAME }));
      if (method === "PATCH" && path.startsWith("/channels/")) {
        const ch = channels.find(c => `/channels/${c.id}` === path);
        if (ch) Object.assign(ch, body);
      }
      return new Response("{}");
    }));
    const first = await loadTemplate("guild", false);
    expect(first.created).toBe(0);
    expect(first.updated).toBe(23);
    expect(calls.filter(c => c.method === "DELETE" || c.method === "POST")).toEqual([]);
    expect(channels.find(c => c.id === "ch-0-2")?.name).toBe("▣・𝖗𝖊𝖌𝖗𝖆𝖘");
    calls.length = 0;
    const second = await loadTemplate("guild", false);
    expect(second.created).toBe(0);
    expect(second.updated).toBe(0);
    expect(calls.filter(c => c.method !== "GET")).toEqual([]);
  });

  it("creates missing channels in their requested categories and order", async () => {
    vi.stubEnv("DISCORD_BOT_TOKEN", "test-token");
    const created: any[] = [];
    vi.stubGlobal("fetch", vi.fn(async (url: string, init?: RequestInit) => {
      const method = init?.method ?? "GET";
      if (method === "GET") return new Response(JSON.stringify(url.endsWith("/channels") ? [] : { name: TEMPLATE_NAME }));
      const body = JSON.parse(String(init?.body));
      if (method === "POST" && url.endsWith("/channels")) {
        const channel = { ...body, id: `created-${created.length}` };
        created.push(channel);
        return new Response(JSON.stringify(channel));
      }
      return new Response("{}");
    }));
    const result = await loadTemplate("guild", false);
    expect(result.created).toBe(42);
    const duos = created.find(c => c.name === "╭・𖤐 𝕯𝖀𝕺𝕾");
    expect(created.filter(c => c.parent_id === duos.id).map(c => c.position)).toEqual([0, 1, 2, 3]);
    const inicio = created.find(c => c.name === "╭・𖤐 𝕴𝕹𝕴𝕮𝕴𝕺");
    expect(created.find(c => c.name === "𖣘・𝖊𝖓𝖙𝖗𝖆𝖉𝖆")?.parent_id).toBe(inicio.id);
  });
});