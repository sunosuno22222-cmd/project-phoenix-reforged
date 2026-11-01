<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep Discord template definitions and legacy name aliases in the browser-safe discord-template module; the server reconciler reuses channel IDs to preserve messages during template updates.
- Discord role assignment uses the password-guarded server function and Discord membership/role checks; confirm the role through a fresh member read, leaving hierarchy enforcement to Discord.
- Discord IP access uses separate original-scene GIF attachments for public portal, entrance and ephemeral eye; user-bound controls and ephemeral IP results must never expose another person's session.
- Defer slow Discord interactions immediately and attach work to Nitro's request.waitUntil when available; never rely solely on detached promises in production.
- Discord live voice requires an external persistent UDP-capable bot host; do not run discord.js voice in the site's Worker or advertise undocumented CapCut APIs as supported integrations.
