import portalGif from "@/assets/portal.gif.asset.json";
import entranceGif from "@/assets/entrance.gif.asset.json";
import eyeGif from "@/assets/eye-idle.gif.asset.json";
import { getRequest } from "@tanstack/react-start/server";
import { botToken } from "./discord.server";
import { portalPanel, privateEyePanel, IP_PRIVATE_FLAGS } from "./discord-ip";

async function gifBlob(source: string) {
  const url = new URL(source, getRequest().url);
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Não consegui carregar a animação (${response.status}).`);
  return new Blob([await response.arrayBuffer()], { type: "image/gif" });
}

export async function gifMessage(payload: Record<string, unknown>, filename: string, source: string) {
  const form = new FormData();
  form.append("payload_json", JSON.stringify({ ...payload, attachments: [{ id: 0, filename }] }));
  form.append("files[0]", await gifBlob(source), filename);
  return form;
}

async function postMedia(url: string, method: string, payload: Record<string, unknown>, filename: string, source: string, headers?: HeadersInit) {
  const response = await fetch(url, { method, headers: headers ?? {}, body: await gifMessage(payload, filename, source) });
  if (!response.ok) {
    const message = await response.text();
    console.error(`Discord media failed [${response.status}]: ${message}`);
    throw new Error(`Discord ${response.status}: ${message.slice(0, 300)}`);
  }
}

export async function sendPortalPanel(channelId: string) {
  await postMedia(`https://discord.com/api/v10/channels/${channelId}/messages`, "POST", portalPanel, "portal.gif", portalGif.url, { Authorization: `Bot ${botToken()}` });
}

export async function enterPrivateEye(webhook: string, userId: string) {
  await postMedia(`${webhook}/messages/@original`, "PATCH", {
    content: "", components: [], flags: IP_PRIVATE_FLAGS,
    embeds: [{ color: 0xb91c1c, image: { url: "attachment://entrance.gif" } }],
    allowed_mentions: { parse: [] },
  }, "entrance.gif", entranceGif.url);
  await new Promise((resolve) => setTimeout(resolve, 1800));
  await postMedia(`${webhook}?wait=true`, "POST", privateEyePanel(userId), "eye.gif", eyeGif.url);
  const removed = await fetch(`${webhook}/messages/@original`, { method: "DELETE" });
  if (!removed.ok && removed.status !== 404) console.error("Discord entrance cleanup failed", removed.status);
}