// src/lib/getMaskedKey.js
import { api } from "./api";

/** Langfuse tRPC llmApiKey.all 응답에서 displaySecretKey만 뽑기 */
export async function fetchProviderMaskedKey({ projectId, provider }) {
  const input = encodeURIComponent(JSON.stringify({ json: { projectId } }));
  const res = await api(`/api/trpc/llmApiKey.all?input=${input}`, {
    method: "GET",
    credentials: "include",
    headers: { accept: "application/json" },
  });
  const json = await res.json();

  // 응답 모양: result.data.json.{ data: [...], totalCount: n }
  const items = json?.result?.data?.json?.data ?? [];
  // provider/name/id 중 하나로 매칭(대소문자 무시)
  const norm = (s) => String(s ?? "").trim().toLowerCase();
  const hit =
    items.find((it) => [it.provider, it.name, it.id].map(norm).includes(norm(provider))) ??
    null;

  // 마스킹 필드 후보들에서 첫 값
  const masked =
    hit?.displaySecretKey ??
    hit?.maskedKey ??
    hit?.obfuscatedKey ??
    hit?.secretKeyMasked ??
    hit?.secretKey ??
    null;

  return masked; // 예: "....ttt"
}
