import { Hono } from "hono";
import { makePayPal, type PayPalApi } from "./paypal.js";
import { runAgent, type Msg } from "./agent.js";

export function createApp(pp: PayPalApi = makePayPal(), env = process.env) {
  const app = new Hono();
  app.get("/api/health", (c) => c.json({ ok: true, paypal: pp.mode, ai: env.OPENROUTER_API_KEY ? "openrouter" : "offline" }));
  app.get("/api/invoices", async (c) => c.json(await pp.listInvoices()));
  app.post("/api/chat", async (c) => {
    const body = await c.req.json<{ messages: Msg[] }>().catch(() => null);
    const messages = (body?.messages ?? []).filter((m) => m.role === "user" || m.role === "assistant").slice(-20);
    if (!messages.length) return c.json({ error: "messages required" }, 400);
    try {
      return c.json(await runAgent(pp, messages, { apiKey: env.OPENROUTER_API_KEY, model: env.OPENROUTER_MODEL }));
    } catch (e: any) {
      return c.json({ error: e.message }, 502);
    }
  });
  return app;
}
