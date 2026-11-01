import { createFileRoute } from "@tanstack/react-router";
import { continueDiscordWork } from "@/lib/discord-background.server";
import { ownsIpControl, IP_PRIVATE_FLAGS } from "@/lib/discord-ip";

const json = (b: unknown) => new Response(JSON.stringify(b), { headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/public/discord/interactions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyDiscordSignature, loadTemplate, postRules, isGuildOwner, sendEyePanel, lookupIp } = await import("@/lib/discord.server");
        const body = await request.text();
        const ok = await verifyDiscordSignature(
          body,
          request.headers.get("x-signature-ed25519") ?? "",
          request.headers.get("x-signature-timestamp") ?? "",
        );
        if (!ok) return new Response("invalid request signature", { status: 401 });

        let i;
        try { i = JSON.parse(body); } catch { return new Response("invalid JSON", { status: 400 }); }
        if (i.type === 1) return json({ type: 1 });
        const eph = (content: string) => json({ type: 4, data: { content, flags: 64 } });
        const u = i.member?.user ?? i.user;
        if (!u?.id || !i.application_id || !i.token) return eph("Interação inválida.");
        const webhook = `https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}`;
        const followup = async (content: string) => {
          const response = await fetch(`${webhook}/messages/@original`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, allowed_mentions: { parse: [] } }),
          });
          if (!response.ok) throw new Error(`Discord ${response.status}: ${await response.text()}`);
        };
        const defer = (task: () => Promise<void>) => {
          continueDiscordWork(request, Promise.resolve().then(task).catch(async (error) => {
            await followup(`Erro: ${(error as Error).message}`);
          }));
          return json({ type: 5, data: { flags: IP_PRIVATE_FLAGS } });
        };

        if (i.type === 3) {
          const cid = i.data?.custom_id;
          try {
            if (cid === "ip_open") {
              // Media follow-up is attached below once the original scenes are loaded.
              const media = await import("@/lib/discord-ip-media.server");
              return defer(() => media.enterPrivateEye(webhook, u.id));
            }
            if (cid === "ip_input" || (typeof cid === "string" && ownsIpControl(cid, u.id) && cid.startsWith("ip_input:"))) {
              return json({ type: 9, data: { custom_id: "ip_modal", title: "Consultar IP", components: [
                { type: 1, components: [{ type: 4, custom_id: "ip", label: "Endereço IP", style: 1, min_length: 3, max_length: 45, required: true, placeholder: "8.8.8.8" }] },
              ] } });
            }
            if (typeof cid === "string" && ownsIpControl(cid, u.id) && cid.startsWith("ip_close:")) {
              return json({ type: 7, data: { content: "Portal fechado.", embeds: [], components: [], attachments: [] } });
            }
          } catch (e) {
            return eph(`Erro: ${(e as Error).message}`);
          }
          return eph("Botão desconhecido.");
        }

        if (i.type === 5 && i.data?.custom_id === "ip_modal") {
          const ip = String(i.data.components?.[0]?.components?.[0]?.value ?? "").trim();
          try {
            return defer(async () => { await followup(await lookupIp(ip)); });
          } catch (e) {
            return eph(`Não consegui consultar: ${(e as Error).message}`);
          }
        }

        if (i.type !== 2) return eph("Interação não suportada.");

        const name = i.data?.name;

        // Only the guild owner can run these commands.
        if (!["regras", "load", "ip-embed"].includes(name)) return eph("Comando desconhecido.");
        return defer(async () => {
          if (!i.guild_id || !(await isGuildOwner(i.guild_id, u.id))) {
            await followup("Só o dono do servidor pode usar este comando.");
            return;
          }
          if (name === "regras") {
            await postRules(i.channel_id);
            await followup("Regras publicadas.");
            return;
          }
          if (name === "load") {
          const id = i.data.options?.find((o: any) => o.name === "id")?.value;
          if (id !== "dog_cyb") { await followup("Template desconhecido."); return; }
              const r = await loadTemplate(i.guild_id, false);
              await followup(`Template **dog_cyb** aplicado: ${r.created} criados, ${r.updated} editados, ${r.skipped} já estavam certos.`);
              return;
          }
          await sendEyePanel(i.channel_id);
          await followup("Portal enviado.");
        });
      },
    },
  },
});
