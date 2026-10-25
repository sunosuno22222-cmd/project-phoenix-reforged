export const TEMPLATE_NAME = "꧁ 𖤐 𝕻𝕬𝕹𝕰𝕷𝕬 𝕯𝕺 𝕮𝕬𝕺𝕾 ꧂";

export interface TemplateChannel {
  name: string;
  type: number;
  topic?: string;
  user_limit?: number;
  rules?: boolean;
  aliases?: string[];
}

interface TemplateBlock {
  category: string;
  aliases?: string[];
  private?: boolean;
  channels: TemplateChannel[];
}

const voice = (label: string, numerals: string[], old: string, limit?: number): TemplateChannel[] =>
  numerals.map((n, i) => ({ name: `◖・${label} 𖠁 ${n}`, type: 2,
    ...(limit === undefined ? {} : { user_limit: limit }),
    aliases: i < 2 ? [`⏐${old}・${i === 0 ? "ɪ" : "ɪɪ"}`] : [],
  }));

export const TEMPLATE: TemplateBlock[] = [
  { category: "╭・𖤐 𝕴𝕹𝕴𝕮𝕴𝕺", aliases: ["✦ ɪɴꜰᴏ"], channels: [
    { name: "𖣘・𝖊𝖓𝖙𝖗𝖆𝖉𝖆", type: 0 },
    { name: "𖣘・𝖘𝖆𝖎𝖉𝖆", type: 0 },
    { name: "▣・𝖗𝖊𝖌𝖗𝖆𝖘", type: 0, topic: "Regras da casa. Apenas leitura.", rules: true, aliases: ["・ʀᴇɢʀᴀs"] },
    { name: "⌗・𝖆𝖓𝖚𝖓𝖈𝖎𝖔𝖘", type: 0, topic: "Avisos da administração.", aliases: ["・ᴀɴᴜɴᴄɪᴏs"] },
    { name: "⌗・𝖕𝖑𝖆𝖖𝖚𝖎𝖓𝖍𝖆𝖘", type: 0, topic: "Pedidos de plaquinhas.", aliases: ["・ᴘʟᴀǫᴜɪɴʜᴀs"] },
  ] },
  { category: "╭・𖤐 𝕾𝕺𝕮𝕴𝕬𝕷", aliases: ["✦ ᴄʜᴀᴛ"], channels: [
    { name: "⌗・𝖈𝖍𝖆𝖙", type: 0, aliases: ["・ᴄʜᴀᴛ"] },
    { name: "⌗・𝖒𝖎𝖉𝖎𝖆𝖘", type: 0, aliases: ["・ᴍɪᴅɪᴀs"] },
    { name: "⌗・𝖒𝖊𝖒𝖊𝖘", type: 0 },
    { name: "⌗・𝖉𝖊𝖘𝖆𝖇𝖆𝖋𝖔", type: 0 },
    { name: "⌗・𝖈𝖔𝖓𝖋𝖎𝖘𝖘𝖔𝖊𝖘", type: 0 },
    { name: "⌗・𝖉𝖎𝖛𝖚𝖑𝖌𝖆𝖈𝖆𝖔", type: 0, aliases: ["・ᴅɪᴠᴜʟɢᴀᴄᴀᴏ"] },
  ] },
  { category: "╭・𖤐 𝕻𝕬𝕹𝕰𝕷𝕬", channels: [
    { name: "⌗・𝖇𝖚𝖘𝖈𝖆𝖗-𝖆𝖒𝖎𝖟𝖆𝖉𝖊", type: 0 },
    { name: "⌗・𝖇𝖚𝖘𝖈𝖆𝖗-𝖉𝖚𝖔", type: 0 },
    { name: "⌗・𝖇𝖚𝖘𝖈𝖆𝖗-𝖈𝖔𝖓𝖛𝖊𝖗𝖘𝖆", type: 0 },
    { name: "⌗・𝖋𝖔𝖙𝖔𝖘-𝖉𝖔-𝖕𝖎𝖛𝖔", type: 0 },
    { name: "⌗・𝖓𝖔𝖙𝖎𝖈𝖎𝖆𝖘", type: 0 },
  ] },
  { category: "╭・𖤐 𝕯𝖀𝕺𝕾", aliases: ["✦ ᴅᴜᴏs"], channels: voice("𝕯𝖀𝕺", ["𝕴", "𝕴𝕴", "𝕴𝕴𝕴", "𝕴𝖁"], "ᴅᴜᴏ", 2) },
  { category: "╭・𖤐 𝕮𝕬𝕷𝕷𝕾", aliases: ["✦ ᴄᴀʟʟs"], channels: voice("𝕮𝕬𝕷𝕷", ["𝕴", "𝕴𝕴", "𝕴𝕴𝕴", "𝕴𝖁"], "ᴄᴀʟʟ") },
  { category: "╭・𖤐 𝕲𝕱", aliases: ["✦ ɢꜰ"], channels: voice("𝕲𝕱", ["𝕴", "𝕴𝕴", "𝕴𝕴𝕴"], "ɢꜰ", 2) },
  { category: "╭・𖤐 𝕸𝖀𝕾𝕴𝕮𝕬", aliases: ["✦ ᴍᴜsɪᴄᴀ"], channels: voice("𝕸𝖀𝕾𝕴𝕮𝕬", ["𝕴", "𝕴𝕴"], "ᴍᴜsɪᴄᴀ") },
  { category: "╭・𖤐 𝕬𝕱𝕶", aliases: ["✦ ᴀꜰᴋ"], channels: voice("𝕬𝕱𝕶", ["𝕴", "𝕴𝕴"], "ᴀꜰᴋ") },
  { category: "╭・𖤐 𝕾𝕰𝕮𝕽𝕰𝕿𝕺", channels: [
    { name: "⌗・𝖈𝖆𝖓𝖆𝖑-𝖉𝖆-𝖒𝖆𝖑𝖉𝖆𝖉𝖊", type: 0 },
    { name: "◖・𝖈𝖆𝖑𝖑-𝖋𝖊𝖈𝖍𝖆𝖉𝖆", type: 2 },
  ] },
];