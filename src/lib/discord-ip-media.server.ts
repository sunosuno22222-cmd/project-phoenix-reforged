import portalGif from "@/assets/portal.gif?inline";
import entranceGif from "@/assets/entrance.gif?inline";
import eyeGif from "@/assets/eye-idle.gif?inline";
import { botToken } from "./discord.server";
import { portalPanel, privateEyePanel, IP_PRIVATE_FLAGS } from "./discord-ip";

function gifBlob(dataUrl: string) {
  const bytes = Uint8Array.from(atob(dataUrl.split(",")[1] ?? ""), (c) => c.charCodeAt(0));
  return new Blob([bytes], { type: "image/gif" });
}

export function gifMessage(payload: Record<string, unknown>, filename: string, dataUrl: string) {
  const form = new FormData();
  form.append("payload_json", JSON.stringify({ ...payload, attachments: [{ id: 0, filename }] }));
  form.append("files[0]", gifBlob(dataUrl), filename);
  return form;
}

async function postMedia(url: string, method: string, payload: Record<string, unknown>, filename: string, source: string, headers?: HeadersInit) {
  const response = await fetch(url, { method, headers: headers ?? {}, body: gifMessage(payload, filename, source) });
  if (!response.ok) {
    const message = await response.text();
    console.error(`Discord media failed [${response.status}]: ${message}`);
    throw new Error(`Discord ${response.status}: ${message.slice(0, 300)}`);
  }
}

export async function sendPortalPanel(channelId: string) {
  await postMedia(`https://discord.com/api/v10/channels/${channelId}/messages`, "POST", portalPanel, "portal.gif", portalGif, { Authorization: `Bot ${botToken()}` });
}

export async function enterPrivateEye(webhook: string, userId: string) {
  await postMedia(`${webhook}/messages/@original`, "PATCH", {
    content: "", components: [], flags: IP_PRIVATE_FLAGS,
    embeds: [{ color: 0xb91c1c, image: { url: "attachment://entrance.gif" } }],
    allowed_mentions: { parse: [] },
  }, "entrance.gif", entranceGif);
  await new Promise((resolve) => setTimeout(resolve, 1800));
  await postMedia(`${webhook}?wait=true`, "POST", privateEyePanel(userId), "eye.gif", eyeGif);
  const removed = await fetch(`${webhook}/messages/@original`, { method: "DELETE" });
  if (!removed.ok && removed.status !== 404) console.error("Discord entrance cleanup failed", removed.status);
}