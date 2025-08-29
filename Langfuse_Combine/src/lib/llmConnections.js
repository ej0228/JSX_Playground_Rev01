// src/lib/llmConnections.js — tRPC v11 단건 호출 클라이언트 (env fallback 제거 버전)
// - projectId는 반드시 호출자가 opts.projectId로 넘겨줘야 함 (없으면 throw)
// - 단건 POST만 사용, 포맷 A 실패 시 포맷 B 재시도
// - 응답은 { result: { data: { json } } } / { json } 둘 다 대응
// - 입력 정규화(키 호환), extraHeaders 배열/객체 변환 지원

import { api } from "./api"; // 프로젝트에 있는 공용 fetch 래퍼. 없다면 window.fetch로 바꿔도 OK.

/* 배열 형태의 헤더 → 레코드 형태로 */
function headersArrayToRecord(arr = []) {
  const out = {};
  for (const h of arr) {
    const k = (h?.key || "").trim();
    if (!k) continue;
    out[k] = (h?.value || "").trim();
  }
  return out;
}

/* 입력 정규화: 다양한 키 이름을 하나로 합치기 */
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
    // extraHeaders는 배열/객체 모두 허용
    extraHeaders: Array.isArray(input.extraHeaders)
      ? input.extraHeaders
      : Object.entries(input.extraHeaders || {}).map(([key, value]) => ({ key, value })),
    customModels: input.customModels ?? input.models ?? [],
  };
}

/* tRPC 호출 헬퍼(단건, 배치X) — 포맷 A → 실패 시 B 재시도 */
async function callTrpc(procedure, payload, projectId) {
  if (!projectId) {
    throw new Error("projectId가 없습니다 (호출 시 opts.projectId를 반드시 전달하세요)");
  }

  const headers = {
    accept: "application/json",
    "content-type": "application/json",
    "x-project": projectId,
    "x-project-id": projectId,
  };

  // 서버가 기대하는 payload 래핑: ★★★ 핵심
  const wrap = (p) => ({ json: p });                    // { json: { ... } }
  const wrapInput = (p) => ({ json: { input: p } });    // { json: { input: ... } }  (fallback 용)
  const wrapBatch = (p, method) => ([
    {
      id: 1,
      json: {
        method,                                         // "mutation" | "query"
        params: { input: { json: p } },                 // { input: { json: ... } }
      },
    },
  ]);

  // ---- 1차: v11 단건 포맷 (권장)  body = { json: payload }
  {
    const res = await api(`/api/trpc/${procedure}`, {
      method: "POST",
      headers,
      json: wrap(payload),
      credentials: "include",
    });
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { }
    if (res.ok && (body?.result?.data?.json !== undefined || body?.json !== undefined)) {
      return body?.result?.data?.json ?? body?.json ?? body;
    }
    // 400 등 에러라도 다음 케이스로 폴백
  }

  // ---- 2차: httpBatchLink 포맷 (batch=1)  body = [ { id, json:{ method, params:{ input:{ json: payload }}} }]
  {
    const isQuery = /\.?(all|get|getAll|list)(?:$|[.?])/.test(procedure);
    const method = isQuery ? "query" : "mutation";
    const res = await api(`/api/trpc/${procedure}?batch=1`, {
      method: "POST",
      headers,
      json: wrapBatch(payload, method),
      credentials: "include",
    });
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { }
    if (res.ok && (body?.[0]?.result?.data?.json !== undefined || body?.[0]?.json !== undefined)) {
      return body?.[0]?.result?.data?.json ?? body?.[0]?.json ?? body?.[0];
    }
  }

  // ---- 3차: 구형 단건 포맷  body = { json: { method, params:{ path, input:{ json: payload }}} }
  {
    const res = await api(`/api/trpc/${procedure}`, {
      method: "POST",
      headers,
      json: {
        json: {
          method: "mutation",
          params: { path: procedure, input: { json: payload } },
        },
      },
      credentials: "include",
    });
    const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { }
    if (res.ok && (body?.result?.data?.json !== undefined || body?.json !== undefined)) {
      return body?.result?.data?.json ?? body?.json ?? body;
    }
    const errMsg =
      body?.error?.json?.message ||
      body?.error?.message ||
      text;
    throw new Error(`tRPC ${procedure} 실패: HTTP ${res.status}\n${errMsg}`);
  }
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

  const { projectId } = opts;
  if (!projectId) throw new Error("projectId required");

  const payload = {
    projectId,
    provider: String(name),
    adapter,
    secretKey: apiKey,
    baseURL: baseUrl || undefined, // 서버는 baseURL(대문자 U)을 기대
    withDefaultModels: !!enableDefaultModels,
    customModels: (customModels || [])
      .map((s) => String(s || "").trim())
      .filter(Boolean),
    extraHeaders: headersArrayToRecord(extraHeaders),
  };

  const result = await callTrpc("llmApiKey.create", payload, projectId);
  return result ?? { ok: true, action: "created" };
}

/** LLM 연결 업데이트 */
export async function updateLlmConnection(id, input, opts = {}) {
  const {
    name, adapter, apiKey, baseUrl,
    extraHeaders, enableDefaultModels, customModels,
  } = normalizeInput(input);

  if (!id) throw new Error("업데이트할 id가 필요합니다");
  const { projectId } = opts;
  if (!projectId) throw new Error("projectId required");

  const payload = {
    id,
    projectId,
    provider: String(name),
    adapter,
    secretKey: apiKey || undefined,
    baseURL: baseUrl || undefined,
    withDefaultModels:
      enableDefaultModels !== undefined ? !!enableDefaultModels : undefined,
    customModels:
      customModels && customModels.length > 0
        ? customModels.map((s) => String(s || "").trim()).filter(Boolean)
        : undefined,
    extraHeaders:
      extraHeaders && extraHeaders.length > 0
        ? headersArrayToRecord(extraHeaders)
        : undefined,
  };

  const result = await callTrpc("llmApiKey.update", payload, projectId);
  return result ?? { ok: true, action: "updated" };
}

/** Upsert: create 실패 시 update(provider 이름 기준) 재시도 */
export async function upsertLlmConnection(input, opts = {}) {
  const { name } = normalizeInput(input);
  try {
    return await createLlmConnection(input, opts);
  } catch (createError) {
    // console.log("[LLM] create 실패, update 시도:", createError?.message);
    try {
      return await updateLlmConnection(name, input, opts);
    } catch (updateError) {
      throw new Error(
        `LLM 연결 생성/업데이트 실패:\nCreate: ${createError?.message}\nUpdate: ${updateError?.message}`
      );
    }
  }
}

/** 목록 조회 */
export async function listLlmConnections(opts = {}) {
  const { projectId } = opts;
  if (!projectId) throw new Error("projectId required");

  const result = await callTrpc("llmApiKey.all", { projectId }, projectId);

  // 서버 응답형 유연 처리
  const items =
    Array.isArray(result?.data) ? result.data :
      Array.isArray(result) ? result :
        result ? [result] : [];

  return items;
}

/** 삭제 */
export async function deleteLlmConnection(id, opts = {}) {
  if (!id) throw new Error("삭제할 id가 필요합니다");
  const { projectId } = opts;
  if (!projectId) throw new Error("projectId required");

  const result = await callTrpc("llmApiKey.delete", { projectId, id }, projectId);
  return result ?? { ok: true };
}

/** 연결 테스트 */
export async function testLlmConnection(input, opts = {}) {
  const {
    name, adapter, apiKey, baseUrl,
    extraHeaders, enableDefaultModels, customModels,
  } = normalizeInput(input);

  const { projectId } = opts;
  if (!projectId) throw new Error("projectId required");

  const payload = {
    projectId,
    provider: String(name),
    adapter,
    secretKey: apiKey,
    baseURL: baseUrl || undefined,
    withDefaultModels: !!enableDefaultModels,
    customModels: (customModels || [])
      .map((s) => String(s || "").trim())
      .filter(Boolean),
    extraHeaders: headersArrayToRecord(extraHeaders),
  };

  const result = await callTrpc("llmApiKey.test", payload, projectId);
  return result;
}
