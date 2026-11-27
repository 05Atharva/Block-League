export class NetworkError extends Error {}
export class RequestError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

export async function request(
  base: string,
  token: string,
  action: string,
  data: unknown = {},
) {
  if (!base.trim())
    throw new NetworkError(
      "Online play is unavailable until a game server is configured.",
    );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let json;
  try {
    const response = await fetch(base.replace(/\/$/, "") + "/api", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ action, data }),
      signal: controller.signal,
    });
    json = await response.json();
  } catch (cause) {
    throw new NetworkError(
      "Could not reach the game server. Check your connection and try again.",
      { cause },
    );
  } finally {
    clearTimeout(timeout);
  }
  if (!json.ok)
    throw new RequestError(json.error || "Request failed", json.code);
  return json.result;
}
