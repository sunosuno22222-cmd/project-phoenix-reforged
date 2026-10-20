import { PANELEIRO_RULES_LIST } from "./rules";

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

const EYE = "https://project--346493f8-76b4-447c-aa5f-5109a129f0de-dev.lovable.app/eye.gif";

export const IP_PANEL = {
  embeds: [{
    title: "👁 ʀᴀsᴛʀᴇᴀᴅᴏʀ ᴅᴇ ɪᴘ",
    description: "Clique no botão para abrir um ticket privado e consultar um IP.\nVocê recebe o mapa + todas as informações.",
    color: 0xb91c1c,
    thumbnail: { url: EYE },
  }],
  components: [{ type: 1, components: [{ type: 2, style: 4, label: "Abrir ticket", emoji: { name: "👁" }, custom_id: "ip_open" }] }],
};

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
      embeds: [{ title: "👁 ᴛɪᴄᴋᴇᴛ ᴅᴇ ɪᴘ", description: "Clique em **Digitar IP** e informe o endereço.", color: 0xb91c1c }],
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

export async function lookupIp(ip: string) {
  const r = await fetchIp(ip);
  const z = 10;
  const n = 2 ** z;
  const x = Math.floor(((r.longitude + 180) / 360) * n);
  const lat = (r.latitude * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2) * n);
  const f = (name: string, value: unknown) => ({ name, value: String(value || "—").slice(0, 1024), inline: true });
  return {
    title: `👁 ${r.ip}`,
    color: 0xb91c1c,
    fields: [
      f("País", `${r.flag?.emoji ?? ""} ${r.country}`), f("Região", r.region), f("Cidade", r.city),
      f("CEP", r.postal), f("Coordenadas", `${r.latitude}, ${r.longitude}`), f("Fuso", r.timezone?.id),
      f("Provedor", r.connection?.isp), f("Organização", r.connection?.org), f("ASN", r.connection?.asn),
      f("Tipo", r.type), f("Continente", r.continent), f("Google Maps", `[abrir](https://www.google.com/maps?q=${r.latitude},${r.longitude})`),
    ],
    image: { url: `https://a.basemaps.cartocdn.com/dark_all/${z}/${x}/${y}@2x.png` },
    thumbnail: { url: EYE },
    footer: { text: "PanelBot • rastreador" },
  };
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

interface TemplateChannel {
  name: string;
  type: number;
  topic?: string;
  user_limit?: number;
  rules?: boolean;
}

const TEMPLATE: { category: string; channels: TemplateChannel[] }[] = [
  {
    category: "✦ ɪɴꜰᴏ",
    channels: [
      { name: "・ʀᴇɢʀᴀs", type: 0, topic: "Regras da casa. Apenas leitura.", rules: true },
      { name: "・ᴀɴᴜɴᴄɪᴏs", type: 0, topic: "Avisos da administração." },
      { name: "・ᴘʟᴀǫᴜɪɴʜᴀs", type: 0, topic: "Pedidos de plaquinhas." },
    ],
  },
  {
    category: "✦ ᴄʜᴀᴛ",
    channels: [
      { name: "・ᴄʜᴀᴛ", type: 0 },
      { name: "・ᴍɪᴅɪᴀs", type: 0 },
      { name: "・ʙᴜsᴄᴀʀ-ɪᴘ", type: 0 },
      { name: "・ᴄᴏᴍᴀɴᴅᴏs", type: 0 },
      { name: "・ᴅɪᴠᴜʟɢᴀᴄᴀᴏ", type: 0 },
    ],
  },
  {
    category: "✦ ᴅᴜᴏs",
    channels: [
      { name: "⏐ᴅᴜᴏ・ɪ", type: 2, user_limit: 2 },
      { name: "⏐ᴅᴜᴏ・ɪɪ", type: 2, user_limit: 2 },
    ],
  },
  {
    category: "✦ ᴄᴀʟʟs",
    channels: [
      { name: "⏐ᴄᴀʟʟ・ɪ", type: 2 },
      { name: "⏐ᴄᴀʟʟ・ɪɪ", type: 2 },
    ],
  },
  {
    category: "✦ ɢꜰ",
    channels: [
      { name: "⏐ɢꜰ・ɪ", type: 2, user_limit: 2 },
      { name: "⏐ɢꜰ・ɪɪ", type: 2, user_limit: 2 },
    ],
  },
  {
    category: "✦ ᴍᴜsɪᴄᴀ",
    channels: [
      { name: "⏐ᴍᴜsɪᴄᴀ・ɪ", type: 2 },
      { name: "⏐ᴍᴜsɪᴄᴀ・ɪɪ", type: 2 },
    ],
  },
  {
    category: "✦ ᴀꜰᴋ",
    channels: [
      { name: "⏐ᴀꜰᴋ・ɪ", type: 2 },
      { name: "⏐ᴀꜰᴋ・ɪɪ", type: 2 },
    ],
  },
];

interface ExistingChannel {
  id: string;
  name: string;
  type: number;
  parent_id?: string | null;
  topic?: string | null;
  user_limit?: number;
}

export async function loadTemplate(guildId: string, purge: boolean, keepChannelId?: string) {
  const logs: string[] = [];
  let existing = await dc<ExistingChannel[]>(`/guilds/${guildId}/channels`);

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

  for (const block of TEMPLATE) {
    // Find or create the category.
    let cat = existing.find((c) => c.type === 4 && c.name === block.category);
    if (!cat) {
      cat = await dc<ExistingChannel>(`/guilds/${guildId}/channels`, {
        method: "POST",
        body: JSON.stringify({ name: block.category, type: 4 }),
      });
      existing.push(cat);
      created++;
      logs.push(`Categoria criada: ${block.category}`);
    }

    for (const ch of block.channels) {
      const { rules, ...wanted } = ch;
      const found = existing.find((c) => c.type === ch.type && c.name === ch.name);

      if (!found) {
        const c = await dc<ExistingChannel>(`/guilds/${guildId}/channels`, {
          method: "POST",
          body: JSON.stringify({ ...wanted, parent_id: cat.id }),
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
      if ((found.parent_id ?? null) !== cat.id) patch["parent_id"] = cat.id;
      if (ch.type === 0 && ch.topic !== undefined && (found.topic ?? "") !== ch.topic) patch["topic"] = ch.topic;
      if (ch.type === 2 && ch.user_limit !== undefined && (found.user_limit ?? 0) !== ch.user_limit) patch["user_limit"] = ch.user_limit;

      if (Object.keys(patch).length > 0) {
        await dc(`/channels/${found.id}`, { method: "PATCH", body: JSON.stringify(patch) });
        updated++;
      } else {
        skipped++;
      }
      if (rules) rulesChannel = found.id;
    }
  }

  logs.push(`${created} criados, ${updated} editados, ${skipped} já estavam certos.`);
  if (rulesChannel && (rulesChannelIsNew || purge)) {
    await postRules(rulesChannel);
    logs.push("Regras publicadas em ・ʀᴇɢʀᴀs.");
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
