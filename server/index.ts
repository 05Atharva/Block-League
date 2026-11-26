import http from "node:http";
import { createHash } from "node:crypto";
import { RoomAccessError, Service } from "./service.ts";
import { resolve, extname, sep } from "node:path";
import { existsSync, readFileSync, statSync } from "node:fs";
export function startServer({
  port = Number(process.env.PORT || 8787),
  host = process.env.HOST || "127.0.0.1",
  file = process.env.DATA_FILE || "./data/block-league.json",
} = {}) {
  const service = new Service(file),
    rate = new Map<string, { count: number; until: number }>();
  const server = http.createServer(async (req, res) => {
    const origin = req.headers.origin || "";
    const allowed = process.env.ALLOWED_ORIGINS?.split(",") || [];
    if (origin && allowed.length && !allowed.includes(origin)) {
      res.writeHead(403);
      res.end("Origin rejected");
      return;
    }
    res.setHeader("Access-Control-Allow-Origin", allowed.length ? origin : "*");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
    res.setHeader("X-Content-Type-Options", "nosniff");
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.url === "/health") {
      res.end(JSON.stringify({ ok: true, build: "0.3.0" }));
      return;
    }
    if (req.method === "POST" && req.url === "/api") {
      try {
        const key = req.socket.remoteAddress || "local";
        const old = rate.get(key);
        const entry =
          old && old.until > Date.now()
            ? old
            : { count: 0, until: Date.now() + 60000 };
        assert(++entry.count <= 6000, "Too many requests. Try again shortly.");
        rate.set(key, entry);
        let data = "";
        for await (const part of req) {
          data += part;
          if (data.length > 262144) throw Error("Request too large");
        }
        const { action, data: body } = JSON.parse(data);
        const token = (req.headers.authorization || "").replace(/^Bearer /, "");
        const userId =
          service.db.sessions[createHash("sha256").update(token).digest("hex")];
        const sensitive =
          action === "recover" || action?.startsWith("guardian.");
        const bucket = (sensitive ? "sensitive:" : "player:") + (userId || key);
        const existing = rate.get(bucket);
        const limit =
          existing && existing.until > Date.now()
            ? existing
            : { count: 0, until: Date.now() + 60000 };
        rate.set(bucket, limit);
        assert(
          ++limit.count <= (sensitive ? 8 : 300),
          sensitive
            ? "Too many verification attempts. Try again in a minute."
            : "Too many requests. Try again shortly.",
        );
        if (rate.size > 10000)
          for (const [k, v] of rate) if (v.until < Date.now()) rate.delete(k);
        const result = service.dispatch(action, body, token);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, result }));
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            ok: false,
            error: e instanceof Error ? e.message : "Request failed",
            ...(e instanceof RoomAccessError && { code: "ROOM_UNAVAILABLE" }),
          }),
        );
      }
      return;
    }
    const root = resolve(process.env.WEB_DIR || "app/web-dist");
    let requested: string;
    try {
      requested = resolve(
        root,
        "." + decodeURIComponent((req.url || "/").split("?")[0]),
      );
    } catch {
      res.writeHead(400);
      res.end("Invalid URL");
      return;
    }
    const rootPrefix = root.endsWith(sep) ? root : root + sep;
    if (requested.startsWith(rootPrefix) || requested === root) {
      let path =
        existsSync(requested) && statSync(requested).isFile()
          ? requested
          : resolve(root, "index.html");
      if (existsSync(path)) {
        const types: Record<string, string> = {
          ".html": "text/html",
          ".js": "text/javascript",
          ".css": "text/css",
          ".json": "application/json",
          ".png": "image/png",
          ".ttf": "font/ttf",
        };
        res.setHeader(
          "Content-Type",
          types[extname(path)] || "application/octet-stream",
        );
        res.end(readFileSync(path));
        return;
      }
    }
    res.writeHead(404);
    res.end(
      "Build the web app: cd app && npx expo export --platform web --output-dir web-dist",
    );
  });
  server.listen(port, host, () =>
    console.log(
      `Block League server: http://${host}:${(server.address() as any).port}`,
    ),
  );
  return { server, service };
}
function assert(v: unknown, message: string) {
  if (!v) throw Error(message);
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("server/index.ts"))
  startServer();
