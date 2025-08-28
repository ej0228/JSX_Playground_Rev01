// src/services/trpc.js
export function unwrapTRPC(json) {
  return json?.result?.data?.json ?? json?.result?.data ?? json;
}

export async function trpcGet(path, inputObj) {
  const input = encodeURIComponent(JSON.stringify({ json: inputObj || {} }));
  const res = await fetch(`/api/trpc/${path}?input=${input}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`GET ${path} failed (${res.status})`);
  const data = await res.json();
  return unwrapTRPC(data);
}

export async function trpcPost(path, bodyObj) {
  const res = await fetch(`/api/trpc/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ json: bodyObj || {} }),
  });
  if (!res.ok) {
    let msg = `POST ${path} failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.error?.message || msg;
    } catch { }
    throw new Error(msg);
  }
  const data = await res.json().catch(() => ({}));
  return unwrapTRPC(data);
}
