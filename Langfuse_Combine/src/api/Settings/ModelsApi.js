import { publicKey, secretKey } from 'lib/langfuse'; // 키 가져오기

const base64Credentials =
  publicKey && secretKey
    ? btoa(`${publicKey}:${secretKey}`)
    : '';

/** Base URL (기본: /api → Vite 프록시로 우회) */
const rawBase = (import.meta.env.VITE_API_BASE)?.trim() ?? "";
const API_BASE = rawBase ? rawBase.replace(/\/+$/, "") : "/api";
const PUBLIC_BASE = `${API_BASE}/public`;

// ★★★ API 인증 에러(401) 해결을 위해 Authorization 헤더 추가 ★★★
function jsonHeaders() {
    const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
    };
    // 인증 정보가 있으면 Authorization 헤더를 추가해줌
    if (base64Credentials) {
        headers['Authorization'] = `Basic ${base64Credentials}`;
    }
    return headers;
}

function withQuery(
    base,
    params
) {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v !== null && v !== undefined && v !== "") usp.set(k, String(v));
    });
    const q = usp.toString();
    return q ? `${base}?${q}` : base;
}

async function readJSON(res) {
    try {
        return (await res.json());
    } catch {
        return undefined;
    }
}

function errorDetail(status, body) {
    const text =
        typeof body === "string" ? body : JSON.stringify(body ?? {}, null, 2);
    return `HTTP ${status} ${text}`;
}

function clampLimit(n, def = 100) {
    const x = Number.isFinite(Number(n)) ? Number(n) : def;
    // 서버 제약: 1 ≤ limit ≤ 100
    return Math.max(1, Math.min(100, x));
}

// ───────────────────────────────────────────────────────────────────────────────
// API calls
// ───────────────────────────────────────────────────────────────────────────────

// 페이지네이션 목록
export async function listModels(
    page = 1,
    limit = 100
) {
    const safeLimit = clampLimit(limit, 100);
    const safePage = Math.max(1, Number(page) || 1);

    const url = withQuery(`${PUBLIC_BASE}/models`, {
        page: safePage,
        limit: safeLimit,
    });

    const res = await fetch(url, { headers: jsonHeaders() });
    const json = await readJSON(res);

    if (!res.ok || !json) {
        throw new Error(`[listModels] ${errorDetail(res.status, json)}`);
    }
    return json;
}

// 모든 페이지 수집 (클라이언트 쪽 페이지네이션)
export async function listAllModels(
    limitPerPage = 100
) {
    const pageSize = clampLimit(limitPerPage, 100);

    const first = await listModels(1, pageSize);
    const out = [...first.data];

    // meta 안전성 고려
    const totalPages =
        typeof first.meta?.totalPages === "number" ? first.meta.totalPages : 1;

    for (let p = 2; p <= totalPages; p++) {
        const next = await listModels(p, pageSize);
        out.push(...next.data);
    }
    return out;
}

// 단건 조회
export async function getModel(id) {
    const url = `${PUBLIC_BASE}/models/${encodeURIComponent(id)}`;
    const res = await fetch(url, { headers: jsonHeaders() });
    const json = await readJSON(res);

    if (!res.ok || !json) {
        throw new Error(`[getModel] ${errorDetail(res.status, json)}`);
    }
    return json;
}

// 생성
export async function createModel(payload) {
    // prices가 없으면 input/outputPrice를 바탕으로 prices 구성
    const body = { ...payload };
    if (!body.prices) {
        const prices = {};
        if (typeof body.inputPrice === "number")
            prices.input = { price: body.inputPrice };
        if (typeof body.outputPrice === "number")
            prices.output = { price: body.outputPrice };
        if (Object.keys(prices).length > 0) body.prices = prices;
    }

    const url = `${PUBLIC_BASE}/models`;
    const res = await fetch(url, {
        method: "POST",
        headers: jsonHeaders(),
        body: JSON.stringify(body),
    });
    const json = await readJSON(res);

    if (!res.ok || !json) {
        throw new Error(`[createModel] ${errorDetail(res.status, json)}`);
    }
    return json;
}

// 삭제
export async function deleteModel(id) {
    const url = `${PUBLIC_BASE}/models/${encodeURIComponent(id)}`;
    const res = await fetch(url, { method: "DELETE", headers: jsonHeaders() });
    if (!res.ok) {
        const json = await readJSON(res);
        throw new Error(`[deleteModel] ${errorDetail(res.status, json)}`);
    }
}