// src/lib/llmConnections.js — Langfuse tRPC 클라이언트 (배치 OFF, v11 호환)
// 변경점:
// - 단건 POST만 사용
// - 1차 포맷 A: { json: { input: {...} } } → 실패 시
// - 2차 포맷 B: { json: { method:"mutation", params:{ path, input } } }
// - projectId는 항상 body의 input에 포함, URL 쿼리에 넣지 않음
// - 응답은 { result: { data: { json } } } / { json } 모두 대응

import { api } from "./api";

/* 헤더 배열 → 레코드 */
function headersArrayToRecord(arr = []) {
  const out = {};
  for (const h of arr) {
    const k = (h?.key || "").trim();
    if (!k) continue;
    out[k] = (h?.value || "").trim();
  }
  return out;
}

/* 입력 정규화: 레거시/다양한 키 대응 */
function normalizeInput(input = {}) {
  return {
    name: input.name ?? input.provider ?? "",
    adapter: input.adapter ?? "openai",
    apiKey: input.apiKey ?? input.secretKey ?? "",
    baseUrl: input.baseUrl ?? input.baseURL ?? undefined,
    enableDefaultModels:
      input.enableDefaultModels ??
      input.useDefaultModels ??
      input.withDefaultModels ??
      true,
    extraHeaders: Array.isArray(input.extraHeaders)
      ? input.extraHeaders
      : Object.entries(input.extraHeaders || {}).map(([key, value]) => ({ key, value })),
    customModels: input.customModels ?? input.models ?? [],
  };
}

/* tRPC 호출 헬퍼 - 단건 호출(배치X), v11 호환 포맷 A→B 재시도 */
async function callTrpc(procedure, input) {
  const envProjectId = import.meta.env.VITE_DEFAULT_PROJECT_ID;
  const projectId = input?.projectId || envProjectId;
  if (!projectId) {
    throw new Error("projectId가 비어있습니다 (.env VITE_DEFAULT_PROJECT_ID 확인)");
  }
  const payload = { ...input, projectId };
  const url = `/api/trpc/${procedure}`;

  const common = {
    method: "POST",
    credentials: "include",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "x-project": projectId,
      "x-project-id": projectId,
    },
  };

  // ── 1차: v11 단건 포맷 A  { json: { input } }
  let res = await api(url, { ...common, json: { json: { input: payload } } });
  let text = await res.text();
  console.log(`[tRPC:A] ${procedure} (${res.status}):`, text);
  let parsedA;
  try { parsedA = JSON.parse(text); } catch { parsedA = undefined; }

  if (res.ok && (parsedA?.result?.data?.json !== undefined || parsedA?.json !== undefined)) {
    return parsedA?.result?.data?.json ?? parsedA?.json ?? parsedA;
  }

  // ── 2차: v11 단건 포맷 B  { json: { method, params:{ path, input } } }
  res = await api(url, {
    ...common,
    json: { json: { method: "mutation", params: { path: procedure, input: payload } } },
  });
  text = await res.text();
  console.log(`[tRPC:B] ${procedure} (${res.status}):`, text);
  let parsedB;
  try { parsedB = JSON.parse(text); } catch { parsedB = undefined; }

  if (res.ok && (parsedB?.result?.data?.json !== undefined || parsedB?.json !== undefined)) {
    return parsedB?.result?.data?.json ?? parsedB?.json ?? parsedB;
  }

  const errMsg =
    parsedB?.error?.json?.message ||
    parsedB?.error?.message ||
    parsedA?.error?.json?.message ||
    parsedA?.error?.message ||
    text;
  throw new Error(`tRPC ${procedure} 실패: HTTP ${res.status}\n${errMsg}`);
}

/** LLM 연결 생성 */
export async function createLlmConnection(input, opts = {}) {
  const {
    name, adapter, apiKey, baseUrl,
    extraHeaders, enableDefaultModels, customModels,
  } = normalizeInput(input);

  if (!name || !apiKey) {
    throw new Error("필수 값 누락: name(provider), apiKey(secretKey)");
  }

  const projectId = opts.projectId || import.meta.env.VITE_DEFAULT_PROJECT_ID;

  const payload = {
    projectId,
    provider: String(name),
    adapter,
    secretKey: apiKey,
    baseURL: baseUrl || undefined, // 서버 기대 키는 baseURL(대문자 U)
    withDefaultModels: !!enableDefaultModels,
    customModels: (customModels || [])
      .map(s => String(s || "").trim())
      .filter(Boolean),
    extraHeaders: headersArrayToRecord(extraHeaders),
  };

  console.log("[LLM] create 요청 payload:", payload);
  const result = await callTrpc("llmApiKey.create", payload);
  console.log("[LLM] create 성공:", result);

  return result ?? { ok: true, action: "created" };
}

/** LLM 연결 업데이트 */
export async function updateLlmConnection(id, input, opts = {}) {
  const {
    name, adapter, apiKey, baseUrl,
    extraHeaders, enableDefaultModels, customModels,
  } = normalizeInput(input);

  if (!id) throw new Error("업데이트할 id가 필요합니다");

  const projectId = opts.projectId || import.meta.env.VITE_DEFAULT_PROJECT_ID;

  const payload = {
    id,
    projectId,
    provider: String(name),
    adapter,
    secretKey: apiKey || undefined,
    baseURL: baseUrl || undefined,
    withDefaultModels:
      enableDefaultModels !== undefined ? !!enableDefaultModels : undefined,
    customModels: customModels && customModels.length > 0
      ? customModels.map(s => String(s || "").trim()).filter(Boolean)
      : undefined,
    extraHeaders:
      extraHeaders && extraHeaders.length > 0
        ? headersArrayToRecord(extraHeaders)
        : undefined,
  };

  console.log("[LLM] update 요청 payload:", payload);
  const result = await callTrpc("llmApiKey.update", payload);
  console.log("[LLM] update 성공:", result);

  return result ?? { ok: true, action: "updated" };
}

/** LLM 연결 생성/업데이트 (Upsert) */
export async function upsertLlmConnection(input, opts = {}) {
  try {
    return await createLlmConnection(input, opts);
  } catch (createError) {
    console.log("[LLM] create 실패, update 시도:", createError.message);
    const { name } = normalizeInput(input);
    try {
      return await updateLlmConnection(name, input, opts);
    } catch (updateError) {
      console.error("[LLM] create/update 모두 실패");
      throw new Error(
        `LLM 연결 생성/업데이트 실패:\nCreate: ${createError.message}\nUpdate: ${updateError.message}`
      );
    }
  }
}

/** LLM 연결 목록 조회 */
export async function listLlmConnections(opts = {}) {
  const projectId = opts.projectId || import.meta.env.VITE_DEFAULT_PROJECT_ID;
  console.log("[LLM] 목록 조회 요청, projectId:", projectId);

  const result = await callTrpc("llmApiKey.all", { projectId });
  console.log("[LLM] 목록 조회 결과:", result);

  // 서버 응답 형태에 유연히 대응
  const items =
    Array.isArray(result?.data) ? result.data :
    Array.isArray(result) ? result :
    result ? [result] : [];

  return items;
}

/** LLM 연결 삭제 */
export async function deleteLlmConnection(id, opts = {}) {
  if (!id) throw new Error("삭제할 id가 필요합니다");

  const projectId = opts.projectId || import.meta.env.VITE_DEFAULT_PROJECT_ID;
  console.log("[LLM] 삭제 요청:", { id, projectId });

  const result = await callTrpc("llmApiKey.delete", { projectId, id });
  console.log("[LLM] 삭제 성공:", result);

  return result ?? { ok: true };
}

/** LLM 연결 테스트 */
export async function testLlmConnection(input, opts = {}) {
  const {
    name, adapter, apiKey, baseUrl,
    extraHeaders, enableDefaultModels, customModels,
  } = normalizeInput(input);

  const projectId = opts.projectId || import.meta.env.VITE_DEFAULT_PROJECT_ID;

  const payload = {
    projectId,
    provider: String(name),
    adapter,
    secretKey: apiKey,
    baseURL: baseUrl || undefined,
    withDefaultModels: !!enableDefaultModels,
    customModels: (customModels || [])
      .map(s => String(s || "").trim())
      .filter(Boolean),
    extraHeaders: headersArrayToRecord(extraHeaders),
  };

  console.log("[LLM] 연결 테스트 요청:", payload);
  const result = await callTrpc("llmApiKey.test", payload);
  console.log("[LLM] 연결 테스트 결과:", result);

  return result;
}
