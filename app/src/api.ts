export async function request(
  base: string,
  token: string,
  action: string,
  data: unknown = {},
) {
  const response = await fetch(base.replace(/\/$/, "") + "/api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ action, data }),
    signal: AbortSignal.timeout(10000),
  });
  const json = await response.json();
  if (!json.ok) throw Error(json.error || "Request failed");
  return json.result;
}
