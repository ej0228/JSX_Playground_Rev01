// src/lib/api.js
const DEFAULT_TIMEOUT = 30000;

function buildInit({ method="GET", headers, json, formData, body, timeout } = {}) {
  const init = { method, headers: new Headers(headers || {}), credentials: "include" };
  
  if (json !== undefined) {
    init.headers.set("content-type", "application/json");
    init.body = JSON.stringify(json);
  } else if (formData instanceof FormData) {
    init.body = formData;
  } else if (body !== undefined) {
    init.body = body;
  }

  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout ?? DEFAULT_TIMEOUT);
  init.signal = ctl.signal;

  return { init, clear: () => clearTimeout(t) };
}

export async function api(path, opts = {}) {
  const { init, clear } = buildInit(opts);
  try {
    const response = await fetch(path, init);
    
    // 디버깅을 위한 로그 추가
    if (path.includes('/api/trpc/')) {
      console.log(`[API] ${init.method} ${path}`, {
        status: response.status,
        headers: Object.fromEntries(init.headers.entries()),
        body: init.body,
      });
    }
    
    return response;
  } finally {
    clear();
  }
}

// tRPC 전용 헬퍼 함수 (httpBatchLink 포맷)
export async function trpcCall(procedure, input, options = {}) {
  const envProjectId = import.meta.env.VITE_DEFAULT_PROJECT_ID;
  const projectId = input?.projectId || envProjectId;
  if (!projectId) throw new Error("projectId가 비어있습니다 (.env VITE_DEFAULT_PROJECT_ID 확인)");

  const isQuery = /\.?(all|get|getAll|list)(?:$|[.?])/.test(procedure);
  const method = isQuery ? "query" : "mutation";

  const batchPayload = [
    {
      id: 1,
      json: {
        method,
        params: { input }, // 반드시 params.input에!
      },
    },
  ];

  const url = `/api/trpc/${procedure}?batch=1&projectId=${encodeURIComponent(projectId)}`;

  return api(url, {
    method: "POST",
    headers: {
      "accept": "application/json",
      "content-type": "application/json",
      // 배포에 따라 헤더에서 읽는 경우까지 커버
      "x-project": projectId,
      "x-project-id": projectId,
      ...(options.headers || {}),
    },
    json: batchPayload,
    ...options,
  });
}