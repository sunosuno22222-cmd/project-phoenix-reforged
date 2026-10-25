import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { assignMemberRole } from "@/lib/discord.server";

vi.mock("@/assets/eye.gif?inline", () => ({ default: "data:image/gif;base64,R0lGODlh" }));
beforeEach(() => vi.stubEnv("DISCORD_BOT_TOKEN", "test-token"));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("Discord role assignment", () => {
  it("adds the selected role to the specified person and reads it back", async () => {
    let assigned = false;
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/roles")) return Response.json([{ id: "role", name: "Membro", managed: false }]);
      if (init?.method === "PUT") { assigned = true; return new Response(null, { status: 204 }); }
      return Response.json({ roles: assigned ? ["role", "existing"] : ["existing"], user: { username: "Pessoa" } });
    });
    vi.stubGlobal("fetch", fetchMock);
    expect(await assignMemberRole("guild", "person", "role")).toEqual({ roleName: "Membro", username: "Pessoa", alreadyAssigned: false });
    expect(fetchMock).toHaveBeenCalledWith("https://discord.com/api/v10/guilds/guild/members/person/roles/role", expect.objectContaining({ method: "PUT" }));
  });

  it("does not change roles when the selected role is already present", async () => {
    const fetchMock = vi.fn(async (url: string) => Response.json(url.endsWith("/roles")
      ? [{ id: "role", name: "Membro", managed: false }]
      : { roles: ["role"], user: { username: "Pessoa" } }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await assignMemberRole("guild", "person", "role")).alreadyAssigned).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([{ id: "guild", managed: false }, { id: "bot-role", managed: true }])("rejects non-assignable role $id", async (role) => {
    const fetchMock = vi.fn(async () => Response.json([{ ...role, name: "Reserved" }]));
    vi.stubGlobal("fetch", fetchMock);
    await expect(assignMemberRole("guild", "person", role.id)).rejects.toThrow("não podem ser atribuídos");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});