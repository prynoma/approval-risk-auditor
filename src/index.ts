import app from "./agent";
import { serveStatic } from "hono/middleware";

const port = Number(process.env.PORT ?? 8787);

app.use("/*", serveStatic({ root: "./public" }));

const server = Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(
  `🚀 Agent ready at http://${server.hostname}:${server.port}/.well-known/agent.json`
);