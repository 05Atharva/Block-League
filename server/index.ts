import http from "node:http";
import { createHash } from "node:crypto";
import { PersistenceUnavailable, RoomAccessError, Service } from "./service.ts";
import { resolve, extname, isAbsolute, sep } from "node:path";
import { existsSync, readFileSync, statSync } from "node:fs";
import { deletionPage } from "./account-deletion.ts";
import { privacyOperator, privacyPolicyPage } from "./privacy-policy.ts";
export function startServer({
  port = Number(process.env.PORT || 8787),
  host = process.env.HOST || "127.0.0.1",
  file = process.env.DATA_FILE || "./data/block-league.json",
  championshipEnabled = process.env.ENABLE_CHAMPIONSHIP === "1",
  production = process.env.BLOCK_LEAGUE_PRODUCTION === "1",
  policyOperator = privacyOperator(process.env) ?? null,
} = {}) {
  if (production && !isAbsolute(file))
    throw Error(
      "Set DATA_FILE to an absolute path on persistent storage before starting production.",
    );
  const service = new Service(file, undefined, championshipEnabled, production),
    rate = new Map<string, { count: number; until: number }>();
  function limitRate(key: string, maximum: number, message: string) {
    const now = Date.now();
    const previous = rate.get(key);
    const entry =
      previous && previous.until > now
        ? previous
        : { count: 0, until: now + 60000 };
    assert(++entry.count <= maximum, message);
    rate.set(key, entry);
    if (rate.size > 10000)
      for (const [bucket, value] of rate)
        if (value.until < now) rate.delete(bucket);
  }
  const server = http.createServer(async (req, res) => {
    if (/^\/privacy-policy\/?$/.test(req.url?.split("?")[0] || "")) {
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { Allow: "GET, HEAD" });
        res.end();
        return;
      }
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("X-Content-Type-Options", "nosniff");
      if (production && !policyOperator) {
        res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Block League’s privacy policy is temporarily unavailable.");
        return;
      }
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
      );
      res.end(
        req.method === "HEAD"
          ? undefined
          : privacyPolicyPage(policyOperator ?? undefined),
      );
      return;
    }
    if (/^\/account-deletion\/?$/.test(req.url?.split("?")[0] || "")) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Referrer-Policy", "no-referrer");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader(
        "Content-Security-Policy",
        "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
      );
      if (req.method === "GET") {
        res.end(deletionPage());
      } else if (req.method === "POST") {
        try {
          limitRate(
            "sensitive:" + (req.socket.remoteAddress || "local"),
            8,
            "Too many verification attempts. Try again in a minute.",
          );
          assert(
            req.headers["content-type"]?.startsWith(
              "application/x-www-form-urlencoded",
            ),
            "Use the account deletion form",
          );
          const form = new URLSearchParams(await readBody(req, 2048));
          assert(form.get("confirm") === "yes", "Confirm permanent deletion");
          const account = service.userByRecovery(form.get("recovery"));
          service.deleteAccount(account.id);
          res.end(deletionPage("deleted"));
        } catch {
          res.statusCode = 400;
          res.end(deletionPage("error"));
        }
      } else {
        res.writeHead(405, { Allow: "GET, POST" });
        res.end();
      }
      return;
    }
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
        limitRate(key, 6000, "Too many requests. Try again shortly.");
        const { action, data: body } = JSON.parse(await readBody(req, 262144));
        const token = (req.headers.authorization || "").replace(/^Bearer /, "");
        const userId =
          service.db.sessions[createHash("sha256").update(token).digest("hex")];
        const sensitive =
          action === "recover" ||
          action === "account.delete" ||
          action?.startsWith("guardian.");
        const bucket = (sensitive ? "sensitive:" : "player:") + (userId || key);
        limitRate(
          bucket,
          sensitive ? 8 : 300,
          sensitive
            ? "Too many verification attempts. Try again in a minute."
            : "Too many requests. Try again shortly.",
        );
        const result = service.dispatch(action, body, token);
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ ok: true, result }));
      } catch (e) {
        const storageUnavailable = e instanceof PersistenceUnavailable;
        res.writeHead(storageUnavailable ? 503 : 400, {
          "Content-Type": "application/json",
        });
        res.end(
          JSON.stringify({
            ok: false,
            error: e instanceof Error ? e.message : "Request failed",
            ...(e instanceof RoomAccessError && { code: "ROOM_UNAVAILABLE" }),
            ...(storageUnavailable && { code: "PERSISTENCE_UNAVAILABLE" }),
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
async function readBody(req: http.IncomingMessage, maximum: number) {
  let data = "";
  req.setEncoding("utf8");
  for await (const chunk of req) {
    data += chunk;
    if (data.length > maximum) throw Error("Request too large");
  }
  return data;
}
function assert(v: unknown, message: string) {
  if (!v) throw Error(message);
}
if (process.argv[1]?.replaceAll("\\", "/").endsWith("server/index.ts"))
  startServer();
