type BackgroundRequest = Request & { waitUntil?: (work: Promise<unknown>) => void };

// Nitro binds the deployed execution context to the request. Local Vite has no context.
export function continueDiscordWork(request: Request, work: Promise<unknown>) {
  const handled = work.catch((error) => console.error("Discord background action failed", error));
  const backgroundRequest = request as BackgroundRequest;
  if (backgroundRequest.waitUntil) backgroundRequest.waitUntil(handled);
  else void handled;
}