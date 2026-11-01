export const IP_PRIVATE_FLAGS = 64;
export const portalPanel = {
  embeds: [{ title: "ᴏʟʜᴏ ᴅᴏ ɪɴꜰᴇʀɴᴏ", description: "O portal está aberto.", color: 0xb91c1c, image: { url: "attachment://portal.gif" } }],
  components: [{ type: 1, components: [{ type: 2, style: 4, label: "Entrar", custom_id: "ip_open" }] }],
};

export function privateEyePanel(userId: string) {
  return {
    flags: IP_PRIVATE_FLAGS,
    content: "",
    embeds: [{ title: "ᴏʟʜᴏ ᴅᴏ ɪɴꜰᴇʀɴᴏ", description: "ᴏ ᴏʟʜᴏ ᴠᴇ ᴛᴜᴅᴏ", color: 0xb91c1c, image: { url: "attachment://eye.gif" } }],
    components: [{ type: 1, components: [
      { type: 2, style: 4, label: "Consultar IP", custom_id: `ip_input:${userId}` },
      { type: 2, style: 2, label: "Fechar", custom_id: `ip_close:${userId}` },
    ] }],
    allowed_mentions: { parse: [] },
  };
}

export function ownsIpControl(customId: string, userId: string) {
  const [action, owner] = customId.split(":");
  return (action === "ip_input" || action === "ip_close") && owner === userId;
}