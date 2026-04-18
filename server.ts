/**
 * Rewritten v2 bootstrap:
 * - dedicated app factory
 * - provider-pluggable analysis
 * - single startup path for dev/prod
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { createApp } from "./src/server/createApp";
import { SessionRepository } from "./src/server/sessionRepository";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

async function startServer() {
  const app = createApp({
    sessionRepository: new SessionRepository(),
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: "spa",
    });

    app.use(vite.middlewares);
  } else {
    app.use((await import("express")).default.static(path.join(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Interaction Pattern Studio listening on 0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exit(1);
});
