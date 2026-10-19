import { createFileRoute } from "@tanstack/react-router";
import { verifyDiscordSignature, loadTemplate, postRules, isGuildOwner, dc, IP_PANEL, openIpTicket, lookupIp } from "@/lib/discord.server";

const json = (b: unknown) => new Response(JSON.stringify(b), { headers: { "Content-Type": "application/json" } });

export const Route = createFileRoute("/api/public/discord/interactions")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.text();
        const ok = await verifyDiscordSignature(
          body,
          request.headers.get("x-signature-ed25519") ?? "",
          request.headers.get("x-signature-timestamp") ?? "",
        );
        if (!ok) return new Response("invalid request signature", { status: 401 });

        const i = JSON.parse(body);
        if (i.type === 1) return json({ type: 1 });
        const eph = (content: string) => json({ type: 4, data: { content, flags: 64 } });
        const u = i.member?.user ?? i.user;

        if (i.type === 3) {
          const cid = i.data?.custom_id;
          try {
            if (cid === "ip_open") {
              const id = await openIpTicket(i.guild_id, u.id, u.username);
              return eph(`Ticket aberto: <#${id}>`);
            }
            if (cid === "ip_input") {
              return json({ type: 9, data: { custom_id: "ip_modal", title: "Consultar IP", components: [
                { type: 1, components: [{ type: 4, custom_id: "ip", label: "Endereço IP", style: 1, min_length: 3, max_length: 45, required: true, placeholder: "8.8.8.8" }] },
              ] } });
            }
            if (cid === "ip_close") {
              await dc(`/channels/${i.channel_id}`, { method: "DELETE" });
              return json({ type: 6 });
            }
          } catch (e) {
            return eph(`Erro: ${(e as Error).message}`);
          }
          return eph("Botão desconhecido.");
        }

        if (i.type === 5 && i.data?.custom_id === "ip_modal") {
          const ip = String(i.data.components?.[0]?.components?.[0]?.value ?? "").trim();
          try {
            return json({ type: 4, data: { embeds: [await lookupIp(ip)] } });
          } catch (e) {
            return eph(`Não consegui consultar: ${(e as Error).message}`);
          }
        }

        if (i.type !== 2) return eph("Interação não suportada.");

        const name = i.data?.name;

        // Only the guild owner can run these commands.
        const userId = i.member?.user?.id ?? i.user?.id;
        try {
          if (!userId || !(await isGuildOwner(i.guild_id, userId))) {
            return json({ type: 4, data: { content: "Só o dono do servidor pode usar este comando.", flags: 64 } });
          }
        } catch (e) {
          return json({ type: 4, data: { content: `Erro ao verificar permissão: ${(e as Error).message}`, flags: 64 } });
        }

        const followup = (content: string) =>
          fetch(`https://discord.com/api/v10/webhooks/${i.application_id}/${i.token}/messages/@original`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
          });

        if (name === "regras") {
          try {
            await postRules(i.channel_id);
            return json({ type: 4, data: { content: "Regras publicadas.", flags: 64 } });
          } catch (e) {
            return json({ type: 4, data: { content: `Erro: ${(e as Error).message}`, flags: 64 } });
          }
        }

        if (name === "load") {
          const id = i.data.options?.find((o: any) => o.name === "id")?.value;
          if (id !== "dog_cyb") return json({ type: 4, data: { content: "Template desconhecido.", flags: 64 } });
          const work = (async () => {
            try {
              const r = await loadTemplate(i.guild_id, false);
              await followup(`Template **dog_cyb** aplicado: ${r.created} criados, ${r.updated} editados, ${r.skipped} já estavam certos.`);
            } catch (e) {
              await followup(`Falha ao aplicar template: ${(e as Error).message}`).catch(() => {});
            }
          })();
          void work;
          return json({ type: 5 });
        }

        if (name === "ip-embed") return json({ type: 4, data: IP_PANEL });

        return json({ type: 4, data: { content: "Comando desconhecido.", flags: 64 } });
      },
    },
  },
});
