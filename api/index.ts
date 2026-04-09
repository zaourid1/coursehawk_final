import type { IncomingMessage, ServerResponse } from "http";
import { app, bootstrap } from "../server/index";

let initialized = false;
async function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  await bootstrap();
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await ensureInitialized();
  app(req as Parameters<typeof app>[0], res as Parameters<typeof app>[1]);
}
