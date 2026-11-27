import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
process.env.EXPO_PUBLIC_STORE_BUILD = "1";
require("../app/app.config.js")({ config: {} });

const api = new URL(process.env.EXPO_PUBLIC_API_URL);
const web = new URL(process.env.EXPO_PUBLIC_WEB_URL);
const checks = [
  [new URL("/health", api), async (r) => (await r.json()).ok === true],
  [
    new URL("/privacy-policy", api),
    async (r) => {
      const html = await r.text();
      return (
        /Block League Privacy Policy/i.test(html) &&
        html.includes('href="mailto:') &&
        html.includes('href="/account-deletion"') &&
        !html.includes("development preview")
      );
    },
  ],
  [
    new URL("/account-deletion", api),
    async (r) => /Delete your Block League account/i.test(await r.text()),
  ],
  [web, async (r) => r.headers.get("content-type")?.includes("text/html")],
];

for (const [url, verify] of checks) {
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok || !(await verify(response)))
    throw Error(
      "Unexpected public release response at " + url.origin + url.pathname,
    );
  console.log("PASS " + url.origin + url.pathname);
}
