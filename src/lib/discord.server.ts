import { PANELEIRO_RULES_LIST } from "./rules";
import { TEMPLATE, TEMPLATE_NAME } from "./discord-template";

const API = "https://discord.com/api/v10";

export function botToken() {
  const t = process.env["DISCORD_BOT_TOKEN"]?.trim();
  if (!t) throw new Error("DISCORD_BOT_TOKEN não configurado.");
  return t;
}

export async function dc<T = any>(path: string, init: RequestInit = {}, attempt = 0): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${botToken()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (res.status === 429 && attempt < 5) {
    const body = (await res.json().catch(() => ({}))) as { retry_after?: number };
    await new Promise((r) => setTimeout(r, Math.ceil((body.retry_after ?? 1) * 1000) + 100));
    return dc<T>(path, init, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord ${res.status}: ${text.slice(0, 300)}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const SLASH_COMMANDS = [
  {
    name: "load",
    description: "Carrega o template do servidor (só o dono)",
    default_member_permissions: "8",
    dm_permission: false,
    options: [
      {
        name: "id",
        description: "ID do template",
        type: 3,
        required: true,
        choices: [
          { name: "dog_cyb - Template completo", value: "dog_cyb" },
        ],
      },
    ],
  },
  {
    name: "regras",
    description: "Publica as regras neste canal (só o dono)",
    default_member_permissions: "8",
    dm_permission: false,
  },
  {
    name: "ip-embed",
    description: "Envia o painel de busca de IP com ticket (só o dono)",
    default_member_permissions: "8",
    dm_permission: false,
  },
];

export { portalPanel as IP_PANEL } from "./discord-ip";

export async function sendEyePanel(channelId: string) {
  const { sendPortalPanel } = await import("./discord-ip-media.server");
  await sendPortalPanel(channelId);
}

export async function openIpTicket(guildId: string, userId: string, username: string) {
  const me = await dc<{ id: string }>("/users/@me");
  const ch = await dc<{ id: string }>(`/guilds/${guildId}/channels`, {
    method: "POST",
    body: JSON.stringify({
      name: `・ɪᴘ-${username}`.slice(0, 90),
      type: 0,
      permission_overwrites: [
        { id: guildId, type: 0, deny: "1024" },
        { id: userId, type: 1, allow: "3072" },
        { id: me.id, type: 1, allow: "3088" },
      ],
    }),
  });
  await dc(`/channels/${ch.id}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content: `<@${userId}>`,
      embeds: [{ title: "ᴛɪᴄᴋᴇᴛ ᴅᴇ ɪᴘ", description: "Clique em **Digitar IP** e informe o endereço.", color: 0xb91c1c }],
      components: [{ type: 1, components: [
        { type: 2, style: 1, label: "Digitar IP", custom_id: "ip_input" },
        { type: 2, style: 2, label: "Fechar ticket", custom_id: "ip_close" },
      ] }],
    }),
  });
  return ch.id;
}

async function fetchIp(ip: string): Promise<any> {
  const e = encodeURIComponent(ip);
  const get = async (u: string) => (await fetch(u, { headers: { "User-Agent": "PanelBot/1.0" } })).json() as Promise<any>;
  const providers: (() => Promise<any>)[] = [
    async () => { const r = await get(`https://ipwho.is/${e}`); if (!r.success) throw new Error(r.message); return r; },
    async () => { const r = await get(`https://freeipapi.com/api/json/${e}`); if (!r.latitude && !r.countryName) throw new Error("x");
      return { ip: r.ipAddress, country: r.countryName, region: r.regionName, city: r.cityName, postal: r.zipCode, latitude: r.latitude, longitude: r.longitude, timezone: { id: r.timeZones?.[0] ?? r.timeZone }, connection: {}, type: `IPv${r.ipVersion}`, continent: r.continent }; },
    async () => { const r = await get(`https://ipapi.co/${e}/json/`); if (r.error) throw new Error(r.reason);
      return { ip: r.ip, country: r.country_name, region: r.region, city: r.city, postal: r.postal, latitude: r.latitude, longitude: r.longitude, timezone: { id: r.timezone }, connection: { isp: r.org, org: r.org, asn: r.asn }, type: r.version, continent: r.continent_code }; },
    async () => { const r = await get(`http://ip-api.com/json/${e}?fields=66846719`); if (r.status !== "success") throw new Error(r.message);
      return { ip: r.query, country: r.country, region: r.regionName, city: r.city, postal: r.zip, latitude: r.lat, longitude: r.lon, timezone: { id: r.timezone }, connection: { isp: r.isp, org: r.org, asn: r.as }, type: r.mobile ? "Móvel" : "Fixo", continent: r.continent }; },
  ];
  let last = "IP inválido";
  for (const p of providers) {
    try { const r = await p(); if (typeof r.latitude === "number") return r; } catch (err) { last = (err as Error).message || last; }
  }
  throw new Error(last);
}

async function extras(r: any) {
  const j = async (u: string) => { try { const x = await fetch(u, { headers: { "User-Agent": "OlhoDoInferno/1.0", "Accept-Language": "pt-BR" } }); return x.ok ? await x.json() as any : null; } catch { return null; } };
  const [geo, ipapi, who] = await Promise.all([
    j(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=16&lat=${r.latitude}&lon=${r.longitude}`),
    j(`http://ip-api.com/json/${encodeURIComponent(r.ip)}?fields=district`),
    j(`https://ipwho.is/${encodeURIComponent(r.ip)}`),
  ]);
  const a = geo?.address ?? {};
  const bairro = ipapi?.district || a.suburb || a.neighbourhood || a.quarter || a.city_district || a.village || a.town;
  let capital = r.capital || who?.capital;
  if (!capital) {
    const code = who?.country_code || a.country_code;
    const c = code ? await j(`https://restcountries.com/v3.1/alpha/${code}?fields=capital`) : null;
    capital = c?.capital?.[0];
  }
  return { bairro, capital };
}

export async function lookupIp(ip: string) {
  const r = await fetchIp(ip);
  const x = await extras(r);
  const f = (name: string, value: unknown) => `## **${name}:**\n${String(value || "—")}`;
  return [
    f("IP", r.ip), f("País", r.country), f("Região", r.region), f("Cidade", r.city), f("Bairro", x.bairro), f("Capital", x.capital),
    f("CEP", r.postal), f("Coordenadas", `${r.latitude}, ${r.longitude}`), f("Fuso", r.timezone?.id),
    f("Provedor", r.connection?.isp), f("Organização", r.connection?.org), f("ASN", r.connection?.asn),
    f("Tipo", r.type), f("Continente", r.continent),
  ].join("\n").slice(0, 2000);
}

export async function registerCommands(guildId?: string) {
  const me = await dc<{ id: string }>("/users/@me");
  const appId = process.env["DISCORD_APPLICATION_ID"]?.trim() || me.id;
  if (guildId) {
    await dc(`/applications/${appId}/guilds/${guildId}/commands`, {
      method: "PUT",
      body: JSON.stringify(SLASH_COMMANDS),
    });
  }
  await dc(`/applications/${appId}/commands`, { method: "PUT", body: JSON.stringify(SLASH_COMMANDS) });
  return { appId };
}

export async function isGuildOwner(guildId: string, userId: string) {
  const guild = await dc<{ owner_id: string }>(`/guilds/${guildId}`);
  return guild.owner_id === userId;
}

export async function assignMemberRole(guildId: string, userId: string, roleId: string) {
  const roles = await dc<{ id: string; name: string; managed: boolean }[]>(`/guilds/${guildId}/roles`);
  const role = roles.find((r) => r.id === roleId);
  if (!role || role.id === guildId || role.managed) {
    throw new Error("Escolha um cargo válido; cargos de bots e @everyone não podem ser atribuídos.");
  }
  let member: { roles: string[]; user: { username: string } };
  try {
    member = await dc(`/guilds/${guildId}/members/${userId}`);
  } catch (e) {
    if ((e as Error).message.startsWith("Discord 404:")) throw new Error("Essa pessoa não está neste servidor ou o ID está incorreto.");
    throw e;
  }
  if (member.roles.includes(roleId)) return { roleName: role.name, username: member.user.username, alreadyAssigned: true };
  try {
    await dc(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, { method: "PUT" });
  } catch (e) {
    if ((e as Error).message.startsWith("Discord 403:")) {
      throw new Error("O bot precisa de Gerenciar Cargos e seu cargo deve estar acima do cargo escolhido no Discord.");
    }
    throw e;
  }
  const confirmed = await dc<{ roles: string[] }>(`/guilds/${guildId}/members/${userId}`);
  if (!confirmed.roles.includes(roleId)) throw new Error("O Discord ainda não confirmou a atribuição. Atualize e confira antes de tentar novamente.");
  return { roleName: role.name, username: member.user.username, alreadyAssigned: false };
}

export function rulesEmbeds() {
  const total = PANELEIRO_RULES_LIST.length;
  return [
    {
      title: "CÓDIGO PENAL PANELEIRO [DOG_CYB]",
      description: "Regulamento oficial do covil. Leu, concordou.",
      color: 0x5865f2,
      fields: PANELEIRO_RULES_LIST.map((r) => ({
        name: r.title.slice(0, 256),
        value: `${r.description}\n*Punição: ${r.punishment}*`.slice(0, 1024),
      })),
      footer: { text: `PanelBot • ${total} regras` },
    },
  ];
}

export async function postRules(channelId: string) {
  for (const embed of rulesEmbeds()) {
    await dc(`/channels/${channelId}/messages`, { method: "POST", body: JSON.stringify({ embeds: [embed] }) });
  }
}

interface ExistingChannel {
  id: string;
  name: string;
  type: number;
  parent_id?: string | null;
  topic?: string | null;
  user_limit?: number;
  position?: number;
}

export async function loadTemplate(guildId: string, purge: boolean, keepChannelId?: string) {
  const logs: string[] = [];
  let existing = await dc<ExistingChannel[]>(`/guilds/${guildId}/channels`);
  const guild = await dc<{ name: string }>(`/guilds/${guildId}`);
  if (guild.name !== TEMPLATE_NAME) {
    await dc(`/guilds/${guildId}`, { method: "PATCH", body: JSON.stringify({ name: TEMPLATE_NAME }) });
    logs.push("Nome do servidor atualizado.");
  }

  if (purge) {
    let removed = 0;
    for (const ch of existing) {
      if (ch.id === keepChannelId) continue;
      try {
        await dc(`/channels/${ch.id}`, { method: "DELETE" });
        removed++;
      } catch (e) {
        logs.push(`Não consegui apagar ${ch.name}: ${(e as Error).message}`);
      }
    }
    logs.push(`${removed} canais apagados.`);
    existing = existing.filter((c) => c.id === keepChannelId);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let rulesChannel: string | undefined;
  let rulesChannelIsNew = false;

  const positions: { id: string; position: number }[] = [];
  for (const [categoryPosition, block] of TEMPLATE.entries()) {
    // Find or create the category.
    let cat = existing.find((c) => c.type === 4 && c.name === block.category)
      ?? existing.find((c) => c.type === 4 && block.aliases?.includes(c.name));
    if (!cat) {
      cat = await dc<ExistingChannel>(`/guilds/${guildId}/channels`, {
        method: "POST",
        body: JSON.stringify({ name: block.category, type: 4 }),
      });
      existing.push(cat);
      created++;
      logs.push(`Categoria criada: ${block.category}`);
    }

    if (cat.name !== block.category) {
      await dc(`/channels/${cat.id}`, { method: "PATCH", body: JSON.stringify({ name: block.category }) });
      cat.name = block.category;
      updated++;
    }
    if (cat.position !== categoryPosition) positions.push({ id: cat.id, position: categoryPosition });

    for (const [channelPosition, ch] of block.channels.entries()) {
      const { rules, aliases, ...wanted } = ch;
      const found = existing.find((c) => c.type === ch.type && c.name === ch.name)
        ?? existing.find((c) => c.type === ch.type && aliases?.includes(c.name));

      if (!found) {
        const c = await dc<ExistingChannel>(`/guilds/${guildId}/channels`, {
          method: "POST",
          body: JSON.stringify({ ...wanted, parent_id: cat.id, position: channelPosition }),
        });
        existing.push({ ...c, parent_id: cat.id });
        created++;
        if (rules) {
          rulesChannel = c.id;
          rulesChannelIsNew = true;
        }
        continue;
      }

      // Channel exists: only edit what changed.
      const patch: Record<string, unknown> = {};
      if (found.name !== ch.name) patch["name"] = ch.name;
      if (found.position !== channelPosition) positions.push({ id: found.id, position: channelPosition });
      if ((found.parent_id ?? null) !== cat.id) patch["parent_id"] = cat.id;
      if (ch.type === 0 && ch.topic !== undefined && (found.topic ?? "") !== ch.topic) patch["topic"] = ch.topic;
      if (ch.type === 2 && ch.user_limit !== undefined && (found.user_limit ?? 0) !== ch.user_limit) patch["user_limit"] = ch.user_limit;

      if (Object.keys(patch).length > 0) {
        await dc(`/channels/${found.id}`, { method: "PATCH", body: JSON.stringify(patch) });
        Object.assign(found, patch);
        updated++;
      } else {
        skipped++;
      }
      if (rules) rulesChannel = found.id;
    }
  }

  if (positions.length) {
    await dc(`/guilds/${guildId}/channels`, { method: "PATCH", body: JSON.stringify(positions) });
    logs.push("Ordem das categorias e canais atualizada.");
  }
  logs.push(`${created} criados, ${updated} editados, ${skipped} já estavam certos.`);
  if (rulesChannel && (rulesChannelIsNew || purge)) {
    await postRules(rulesChannel);
    logs.push("Regras publicadas em ▣・𝖗𝖊𝖌𝖗𝖆𝖘.");
  }
  return { created, updated, skipped, logs };
}

function hexToBytes(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

export async function verifyDiscordSignature(body: string, signature: string, timestamp: string) {
  const pub = process.env["DISCORD_PUBLIC_KEY"]?.trim();
  if (!pub || !signature || !timestamp) return false;
  try {
    const key = await crypto.subtle.importKey("raw", hexToBytes(pub), { name: "Ed25519" }, false, ["verify"]);
    return await crypto.subtle.verify(
      "Ed25519",
      key,
      hexToBytes(signature),
      new TextEncoder().encode(timestamp + body),
    );
  } catch {
    return false;
  }
}
