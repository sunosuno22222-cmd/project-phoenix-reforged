import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const auth = z.object({ password: z.string().max(200) });

async function guard(password: string) {
  const expected = process.env["PANEL_PASSWORD"];
  if (!expected) throw new Error("PANEL_PASSWORD não configurada.");
  if (password !== expected) throw new Error("Senha do painel incorreta.");
  return import("./discord.server");
}

const snowflake = z.string().regex(/^\d{5,25}$/);

export const getOverview = createServerFn({ method: "POST" })
  .inputValidator((d) => auth.parse(d))
  .handler(async ({ data }) => {
    const d = await guard(data.password);
    const bot = await d.dc<{ id: string; username: string; avatar: string | null }>("/users/@me");
    const guilds = await d.dc<{ id: string; name: string; icon: string | null }[]>("/users/@me/guilds");
    return {
      bot: {
        id: bot.id,
        username: bot.username,
        avatar: bot.avatar ? `https://cdn.discordapp.com/avatars/${bot.id}/${bot.avatar}.png` : null,
      },
      inviteUrl: `https://discord.com/oauth2/authorize?client_id=${process.env["DISCORD_APPLICATION_ID"]?.trim() || bot.id}&permissions=8&scope=bot%20applications.commands`,
      hasPublicKey: Boolean(process.env["DISCORD_PUBLIC_KEY"]),
      guilds: guilds.map((g) => ({
        id: g.id,
        name: g.name,
        icon: g.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png` : null,
      })),
    };
  });

export const getGuild = createServerFn({ method: "POST" })
  .inputValidator((d) => auth.extend({ guildId: snowflake }).parse(d))
  .handler(async ({ data }) => {
    const d = await guard(data.password);
    const [guild, channels, roles] = await Promise.all([
      d.dc<any>(`/guilds/${data.guildId}?with_counts=true`),
      d.dc<any[]>(`/guilds/${data.guildId}/channels`),
      d.dc<any[]>(`/guilds/${data.guildId}/roles`),
    ]);
    return {
      id: guild.id as string,
      name: guild.name as string,
      members: (guild.approximate_member_count ?? 0) as number,
      online: (guild.approximate_presence_count ?? 0) as number,
      channels: channels
        .map((c) => ({ id: c.id as string, name: c.name as string, type: c.type as number, parentId: (c.parent_id ?? null) as string | null, position: c.position as number }))
        .sort((a, b) => a.position - b.position),
      roles: roles
        .map((r) => ({ id: r.id as string, name: r.name as string, color: r.color ? `#${r.color.toString(16).padStart(6, "0")}` : null, position: r.position as number }))
        .sort((a, b) => b.position - a.position),
    };
  });

export const registerSlashCommands = createServerFn({ method: "POST" })
  .inputValidator((d) => auth.extend({ guildId: snowflake.optional() }).parse(d))
  .handler(async ({ data }) => {
    const d = await guard(data.password);
    await d.registerCommands(data.guildId);
    return { ok: true };
  });

export const runLoadTemplate = createServerFn({ method: "POST" })
  .inputValidator((d) => auth.extend({ guildId: snowflake, purge: z.boolean() }).parse(d))
  .handler(async ({ data }) => {
    const d = await guard(data.password);
    return d.loadTemplate(data.guildId, data.purge);
  });

export const publishRules = createServerFn({ method: "POST" })
  .inputValidator((d) => auth.extend({ channelId: snowflake }).parse(d))
  .handler(async ({ data }) => {
    const d = await guard(data.password);
    await d.postRules(data.channelId);
    return { ok: true };
  });

export const sendMessage = createServerFn({ method: "POST" })
  .inputValidator((d) => auth.extend({ channelId: snowflake, content: z.string().min(1).max(2000) }).parse(d))
  .handler(async ({ data }) => {
    const d = await guard(data.password);
    await d.dc(`/channels/${data.channelId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: data.content, allowed_mentions: { parse: [] } }),
    });
    return { ok: true };
  });
