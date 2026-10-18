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
];

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
    category: "・ 𝐈𝐍𝐅𝐎 ・",
    channels: [
      { name: "・𝗿𝗲𝗴𝗿𝗮𝘀", type: 0, topic: "Regras da casa. Apenas leitura.", rules: true },
      { name: "・𝗮𝗻𝘂𝗻𝗰𝗶𝗼𝘀", type: 0, topic: "Avisos da administração." },
      { name: "・𝗽𝗹𝗮𝗾𝘂𝗶𝗻𝗵𝗮𝘀", type: 0, topic: "Pedidos de plaquinhas." },
    ],
  },
  {
    category: "・ 𝐂𝐇𝐀𝐓 ・",
    channels: [
      { name: "・𝘀𝗺𝘀", type: 0 },
      { name: "・𝗺𝗶𝗱𝗶𝗮𝘀", type: 0 },
      { name: "・𝗯𝘂𝘀𝗰𝗮𝗿-𝗶𝗽", type: 0 },
      { name: "・𝗰𝗼𝗺𝗮𝗻𝗱𝗼𝘀", type: 0 },
      { name: "・𝗱𝗶𝘃𝘂𝗹𝗴𝗮𝗰𝗮𝗼", type: 0 },
    ],
  },
  {
    category: "・ 𝐃𝐔𝐎𝐒 ・",
    channels: [
      { name: "・𝗱𝘂𝗼-𝟭", type: 2, user_limit: 2 },
      { name: "・𝗱𝘂𝗼-𝟮", type: 2, user_limit: 2 },
    ],
  },
  {
    category: "・ 𝐂𝐀𝐋𝐋𝐒 ・",
    channels: [
      { name: "・𝗰𝗮𝗹𝗹-𝟭", type: 2 },
      { name: "・𝗰𝗮𝗹𝗹-𝟮", type: 2 },
    ],
  },
  {
    category: "・ 𝐆𝐅 ・",
    channels: [
      { name: "・𝗴𝗳-𝟭", type: 2, user_limit: 2 },
      { name: "・𝗴𝗳-𝟮", type: 2, user_limit: 2 },
    ],
  },
  {
    category: "・ 𝐌𝐔𝐒𝐈𝐂𝐀 ・",
    channels: [
      { name: "・𝗺𝘂𝘀𝗶𝗰𝗮-𝟭", type: 2 },
      { name: "・𝗺𝘂𝘀𝗶𝗰𝗮-𝟮", type: 2 },
    ],
  },
  {
    category: "・ 𝐀𝐅𝐊 ・",
    channels: [
      { name: "・𝗮𝗳𝗸-𝟭", type: 2 },
      { name: "・𝗮𝗳𝗸-𝟮", type: 2 },
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
    logs.push("Regras publicadas em ・𝗿𝗲𝗴𝗿𝗮𝘀.");
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
