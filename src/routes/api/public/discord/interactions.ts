import { createFileRoute } from "@tanstack/react-router";
import { verifyDiscordSignature, loadTemplate, postRules } from "@/lib/discord.server";

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
        if (i.type !== 2) return json({ type: 4, data: { content: "Interação não suportada.", flags: 64 } });

        const name = i.data?.name;
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
              await followup(`Template **dog_cyb** aplicado: ${r.created} canais criados e regras publicadas.`);
            } catch (e) {
              await followup(`Falha ao aplicar template: ${(e as Error).message}`).catch(() => {});
            }
          })();
          void work;
          return json({ type: 5 });
        }

        return json({ type: 4, data: { content: "Comando desconhecido.", flags: 64 } });
      },
    },
  },
});
