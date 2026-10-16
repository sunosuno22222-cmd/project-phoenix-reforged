import { PANELEIRO_RULES_LIST } from "./rules";

const API = "https://discord.com/api/v10";

export function botToken() {
  const t = process.env.DISCORD_BOT_TOKEN?.trim();
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
    description: "Carrega o template do servidor",
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
    description: "Publica as regras neste canal",
    default_member_permissions: "8",
    dm_permission: false,
  },
];

export async function registerCommands(guildId?: string) {
  const me = await dc<{ id: string }>("/users/@me");
  const appId = process.env.DISCORD_APPLICATION_ID?.trim() || me.id;
  if (guildId) {
    await dc(`/applications/${appId}/guilds/${guildId}/commands`, {
      method: "PUT",
      body: JSON.stringify(SLASH_COMMANDS),
    });
  }
  await dc(`/applications/${appId}/commands`, { method: "PUT", body: JSON.stringify(SLASH_COMMANDS) });
  return { appId };
}

export function rulesEmbeds() {
  const toField = (r: (typeof PANELEIRO_RULES_LIST)[number]) => ({
    name: r.title.slice(0, 256),
    value: `${r.description}\n*Punição: ${r.punishment}*`.slice(0, 1024),
  });
  const total = PANELEIRO_RULES_LIST.length;
  return [
    {
      title: "CÓDIGO PENAL PANELEIRO [DOG_CYB] • PARTE 1/2",
      description: "Regulamento oficial do covil.",
      color: 0x5865f2,
      fields: PANELEIRO_RULES_LIST.slice(0, 15).map(toField),
      footer: { text: `PanelBot • regras 1 a 15 de ${total}` },
    },
    {
      title: "CÓDIGO PENAL PANELEIRO [DOG_CYB] • PARTE 2/2",
      description: "Diretrizes de voz, shitpost e segurança.",
      color: 0x9b59b6,
      fields: PANELEIRO_RULES_LIST.slice(15, 30).map(toField),
      footer: { text: `PanelBot • regras 16 a ${total} de ${total}` },
    },
  ];
}

export async function postRules(channelId: string) {
  // Discord limits total embed size to 6000 chars per message, so send one per message.
  for (const embed of rulesEmbeds()) {
    await dc(`/channels/${channelId}/messages`, { method: "POST", body: JSON.stringify({ embeds: [embed] }) });
  }
}

const TEMPLATE = [
  {
    category: "・ 𝐈𝐍𝐅𝐎𝐑𝐌𝐀𝐂̧𝐎̃𝐄𝐒 ・",
    channels: [
      { name: "・ 𝗲𝗻𝘁𝗿𝗮𝗱𝗮", type: 0, topic: "Boas-vindas" },
      { name: "・ 𝘀𝗮𝗶𝗻𝗱𝗼", type: 0, topic: "Saídas" },
      { name: "・ 𝗿𝗲𝗴𝗿𝗮𝘀", type: 0, topic: "Regras da casa. Apenas leitura.", rules: true },
      { name: "・ 𝗮𝗻𝘂𝗻𝗰𝗶𝗼𝘀", type: 0, topic: "Avisos da administração." },
      { name: "・ 𝗽𝗹𝗮𝗾𝘂𝗶𝗻𝗵𝗮𝘀", type: 0, topic: "Pedidos de plaquinhas." },
    ],
  },
  {
    category: "・ 𝐂𝐇𝐀𝐓 𝐆𝐄𝐑𝐀𝐋 ・",
    channels: ["・ 𝘀𝗺𝘀", "・ 𝗺𝗶𝗱𝗶𝗮𝘀", "・ 𝗯𝘂𝘀𝗰𝗮𝗿-𝗶𝗽", "・ 𝗰𝗼𝗺𝗮𝗻𝗱𝗼𝘀", "・ 𝗱𝗶𝘃𝘂𝗹𝗴𝗮𝗰𝗮𝗼"].map((name) => ({ name, type: 0 })),
  },
  {
    category: "・ 𝐕𝐎𝐙 & 𝐂𝐀𝐋𝐋𝐒 ・",
    channels: [
      ["・ 𝗱𝘂𝗼 𝟭", 2], ["・ 𝗱𝘂𝗼 𝟮", 2], ["・ 𝗰𝗮𝗹𝗹 𝟭", 0], ["・ 𝗰𝗮𝗹𝗹 𝟮", 0], ["・ 𝗴𝗳 𝟭", 2],
      ["・ 𝗴𝗳 𝟮", 2], ["・ 𝗺𝘂𝘀𝗶𝗰𝗮 𝟭", 0], ["・ 𝗺𝘂𝘀𝗶𝗰𝗮 𝟮", 0], ["・ 𝗮𝗳𝗸 𝟭", 0], ["・ 𝗮𝗳𝗸 𝟮", 0],
    ].map(([name, limit]) => ({ name: name as string, type: 2, user_limit: limit as number })),
  },
];

export async function loadTemplate(guildId: string, purge: boolean, keepChannelId?: string) {
  const logs: string[] = [];
  if (purge) {
    const existing = await dc<{ id: string }[]>(`/guilds/${guildId}/channels`);
    let removed = 0;
    for (const ch of existing) {
      if (ch.id === keepChannelId) continue;
      try {
        await dc(`/channels/${ch.id}`, { method: "DELETE" });
        removed++;
      } catch (e) {
        logs.push(`Não consegui apagar ${ch.id}: ${(e as Error).message}`);
      }
    }
    logs.push(`${removed} canais apagados.`);
  }
  let rulesChannel: string | undefined;
  let created = 0;
  for (const block of TEMPLATE) {
    const cat = await dc<{ id: string }>(`/guilds/${guildId}/channels`, {
      method: "POST",
      body: JSON.stringify({ name: block.category, type: 4 }),
    });
    created++;
    for (const ch of block.channels as any[]) {
      const { rules, ...body } = ch;
      const c = await dc<{ id: string }>(`/guilds/${guildId}/channels`, {
        method: "POST",
        body: JSON.stringify({ ...body, parent_id: cat.id }),
      });
      created++;
      if (rules) rulesChannel = c.id;
    }
  }
  logs.push(`${created} canais/categorias criados.`);
  if (rulesChannel) {
    await postRules(rulesChannel);
    logs.push("Regras publicadas em ・ 𝗿𝗲𝗴𝗿𝗮𝘀.");
  }
  return { created, logs };
}

function hexToBytes(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

export async function verifyDiscordSignature(body: string, signature: string, timestamp: string) {
  const pub = process.env.DISCORD_PUBLIC_KEY?.trim();
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
