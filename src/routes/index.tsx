import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Hash, Volume2, Folder, Shield, Terminal, RefreshCw, LogOut, Send, ScrollText, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import avatar from "@/assets/panelbot.jpg";
import {
  getOverview,
  getGuild,
  registerSlashCommands,
  runLoadTemplate,
  publishRules,
  sendIpPanel,
  sendMessage,
} from "@/lib/discord.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PanelBot — Painel do bot Discord" },
      { name: "description", content: "Gerencie seu bot Discord real: servidores, canais, cargos, regras e comando /load." },
      { property: "og:title", content: "PanelBot — Painel do bot Discord" },
      { property: "og:description", content: "Gerencie seu bot Discord real: servidores, canais, cargos, regras e comando /load." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Panel,
});

type Overview = Awaited<ReturnType<typeof getOverview>>;
type Guild = Awaited<ReturnType<typeof getGuild>>;

function Panel() {
  const [password, setPassword] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const p = sessionStorage.getItem("panel_pw");
    if (p) setSaved(p);
  }, []);

  const load = async (pw: string) => {
    setLoading(true);
    try {
      const o = await getOverview({ data: { password: pw } });
      setOverview(o);
      setSaved(pw);
      sessionStorage.setItem("panel_pw", pw);
    } catch (e) {
      toast.error((e as Error).message);
      sessionStorage.removeItem("panel_pw");
      setSaved(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (saved && !overview) load(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  if (!saved || !overview) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(password);
          }}
          className="w-full max-w-sm space-y-5 rounded-2xl border bg-card p-8 shadow-2xl"
        >
          <img src={avatar} alt="PanelBot" className="mx-auto h-16 w-16 rounded-2xl" />
          <div className="text-center">
            <h1 className="text-2xl font-bold">PanelBot</h1>
            <p className="text-sm text-muted-foreground">Digite a senha do painel para controlar o bot.</p>
          </div>
          <Input type="password" placeholder="Senha do painel" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button className="w-full" disabled={loading || !password}>
            {loading ? "Conectando..." : "Entrar"}
          </Button>
        </form>
      </main>
    );
  }

  return (
    <Dashboard
      overview={overview}
      password={saved}
      onRefresh={() => load(saved)}
      onLogout={() => {
        sessionStorage.removeItem("panel_pw");
        setSaved(null);
        setOverview(null);
      }}
    />
  );
}

function Dashboard({ overview, password, onRefresh, onLogout }: { overview: Overview; password: string; onRefresh: () => void; onLogout: () => void }) {
  const [guildId, setGuildId] = useState<string | null>(overview.guilds[0]?.id ?? null);
  const [guild, setGuild] = useState<Guild | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const log = (m: string) => setLogs((l) => [`${new Date().toLocaleTimeString()}  ${m}`, ...l].slice(0, 50));

  const refreshGuild = async (id: string) => {
    try {
      setGuild(await getGuild({ data: { password, guildId: id } }));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  useEffect(() => {
    setGuild(null);
    if (guildId) refreshGuild(guildId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guildId]);

  const run = async (key: string, fn: () => Promise<string>) => {
    setBusy(key);
    try {
      const msg = await fn();
      toast.success(msg);
      log(msg);
    } catch (e) {
      toast.error((e as Error).message);
      log(`ERRO: ${(e as Error).message}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex gap-3 overflow-x-auto border-b bg-sidebar p-3 md:w-20 md:flex-col md:items-center md:border-b-0 md:border-r">
        {overview.guilds.map((g) => (
          <button
            key={g.id}
            title={g.name}
            onClick={() => setGuildId(g.id)}
            className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-sidebar-accent text-sm font-bold transition-all hover:rounded-xl ${guildId === g.id ? "ring-2 ring-sidebar-primary" : ""}`}
          >
            {g.icon ? <img src={g.icon} alt={g.name} className="h-full w-full object-cover" /> : g.name.slice(0, 2).toUpperCase()}
          </button>
        ))}
      </aside>

      <div className="flex-1 p-4 md:p-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={overview.bot.avatar ?? avatar} alt="" className="h-11 w-11 rounded-full" />
            <div>
              <h1 className="text-xl font-bold">{overview.bot.username}</h1>
              <p className="text-xs text-muted-foreground">
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-accent" />
                Bot real conectado · {overview.guilds.length} servidor(es)
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" asChild>
              <a href={overview.inviteUrl} target="_blank" rel="noreferrer">Convidar bot</a>
            </Button>
            <Button variant="secondary" size="icon" onClick={onRefresh} aria-label="Atualizar"><RefreshCw /></Button>
            <Button variant="secondary" size="icon" onClick={onLogout} aria-label="Sair"><LogOut /></Button>
          </div>
        </header>

        {!overview.hasPublicKey && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
            Falta a chave pública (DISCORD_PUBLIC_KEY): os comandos / dentro do Discord não vão responder.
          </div>
        )}

        {overview.guilds.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center">
            <h2 className="text-lg font-bold">O bot ainda não está em nenhum servidor</h2>
            <p className="mt-1 text-sm text-muted-foreground">Clique em “Convidar bot” e adicione ele a um servidor seu.</p>
          </div>
        ) : !guild ? (
          <p className="text-muted-foreground">Carregando servidor...</p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <section className="space-y-4 lg:col-span-2">
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Membros" value={guild.members} />
                <Stat label="Online" value={guild.online} />
                <Stat label="Canais" value={guild.channels.length} />
              </div>

              <Card title="Ações" icon={<Zap className="h-4 w-4" />}>
                <Actions guild={guild} password={password} busy={busy} run={run} onDone={() => refreshGuild(guild.id)} />
              </Card>

              <Card title="Console" icon={<Terminal className="h-4 w-4" />}>
                <pre className="max-h-56 overflow-auto rounded-lg bg-background p-3 font-mono text-xs text-muted-foreground">
                  {logs.length ? logs.join("\n") : "Nenhuma ação ainda."}
                </pre>
              </Card>
            </section>

            <section className="space-y-4">
              <Card title={`Canais · ${guild.name}`} icon={<Hash className="h-4 w-4" />}>
                <ChannelTree channels={guild.channels} />
              </Card>
              <Card title="Cargos" icon={<Shield className="h-4 w-4" />}>
                <div className="flex flex-wrap gap-1.5">
                  {guild.roles.map((r) => (
                    <Badge key={r.id} variant="secondary" className="gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color ?? "var(--muted-foreground)" }} />
                      {r.name}
                    </Badge>
                  ))}
                </div>
              </Card>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Actions({ guild, password, busy, run, onDone }: { guild: Guild; password: string; busy: string | null; run: (k: string, f: () => Promise<string>) => Promise<void>; onDone: () => void }) {
  const textChannels = guild.channels.filter((c) => c.type === 0 || c.type === 5);
  const [purge, setPurge] = useState(false);
  const [channelId, setChannelId] = useState(textChannels[0]?.id ?? "");
  const [content, setContent] = useState("");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Button
          disabled={!!busy}
          onClick={() => run("cmd", async () => { await registerSlashCommands({ data: { password, guildId: guild.id } }); return "Comandos /load e /regras registrados."; })}
        >
          {busy === "cmd" ? "Registrando..." : "Registrar comandos /"}
        </Button>
        <Button
          variant="destructive"
          disabled={!!busy}
          onClick={() => {
            if (purge && !confirm(`Isso APAGA todos os canais de "${guild.name}". Continuar?`)) return;
            run("tpl", async () => {
              const r = await runLoadTemplate({ data: { password, guildId: guild.id, purge } });
              onDone();
              return `Template dog_cyb aplicado: ${r.created} criados. ${r.logs.join(" ")}`;
            });
          }}
        >
          {busy === "tpl" ? "Aplicando..." : "/load dog_cyb"}
        </Button>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch checked={purge} onCheckedChange={setPurge} /> Apagar canais antes
        </label>
      </div>

      <div className="space-y-2">
        <select
          value={channelId}
          onChange={(e) => setChannelId(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          {textChannels.map((c) => <option key={c.id} value={c.id}># {c.name}</option>)}
        </select>
        <Textarea placeholder="Mensagem para enviar como bot..." value={content} onChange={(e) => setContent(e.target.value)} maxLength={2000} />
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={!!busy || !channelId || !content.trim()}
            onClick={() => run("msg", async () => { await sendMessage({ data: { password, channelId, content } }); setContent(""); return "Mensagem enviada."; })}>
            <Send /> Enviar
          </Button>
          <Button variant="secondary" disabled={!!busy || !channelId}
            onClick={() => run("rules", async () => { await publishRules({ data: { password, channelId } }); return "Regras publicadas."; })}>
            <ScrollText /> Publicar regras
          </Button>
          <Button variant="destructive" disabled={!!busy || !channelId}
            onClick={() => run("eye", async () => { await sendIpPanel({ data: { password, channelId } }); return "Olho do diabo enviado."; })}>
            👁 Enviar olho do diabo
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChannelTree({ channels }: { channels: Guild["channels"] }) {
  const cats = channels.filter((c) => c.type === 4);
  const orphan = channels.filter((c) => c.type !== 4 && !c.parentId);
  const Row = ({ c }: { c: Guild["channels"][number] }) => (
    <li className="flex items-center gap-1.5 truncate py-0.5 text-sm text-muted-foreground">
      {c.type === 2 || c.type === 13 ? <Volume2 className="h-3.5 w-3.5 shrink-0" /> : <Hash className="h-3.5 w-3.5 shrink-0" />}
      {c.name}
    </li>
  );
  return (
    <div className="max-h-96 space-y-3 overflow-auto">
      {orphan.length > 0 && <ul>{orphan.map((c) => <Row key={c.id} c={c} />)}</ul>}
      {cats.map((cat) => (
        <div key={cat.id}>
          <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide"><Folder className="h-3 w-3" />{cat.name}</p>
          <ul className="ml-2">{channels.filter((c) => c.parentId === cat.id).map((c) => <Row key={c.id} c={c} />)}</ul>
        </div>
      ))}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">{icon}{title}</h2>
      {children}
    </div>
  );
}
