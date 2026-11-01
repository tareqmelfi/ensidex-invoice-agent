import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createApp } from "./app.js";

const app = createApp();
app.use("/*", serveStatic({ root: "./dist-web" }));
app.get("*", serveStatic({ path: "./dist-web/index.html" }));
const port = Number(process.env.PORT ?? 8787);
serve({ fetch: app.fetch, port }, () => console.log(`ENSIDEX Invoice Agent on http://localhost:${port}`));
