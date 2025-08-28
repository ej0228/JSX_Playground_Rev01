import { useCallback, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "playground:modelAdvSettings";

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

const DEFAULTS = {
  useTemperature: true,
  useTopP: false,
  useMaxTokens: false,

  temperature: 0.7, // 0~2
  topP: 1,          // 0~1
  maxTokens: 4096,  // 1~32000

  additionalOptions: false,
  apiKeyOverride: "",
};

function nsKey(projectId, provider, model) {
  return `${projectId || "default"}::${provider || "unknown"}::${model || "unknown"}`;
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveStore(obj) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch {}
}

export default function useModelParams({ projectId, provider, model }) {
  const key = useMemo(() => nsKey(projectId, provider, model), [projectId, provider, model]);
  const [values, setValues] = useState(DEFAULTS);

  useEffect(() => {
    const store = loadStore();
    const existing = store[key];
    if (existing) setValues((prev) => ({ ...prev, ...existing }));
    else setValues(DEFAULTS);
  }, [key]);

  useEffect(() => {
    const store = loadStore();
    store[key] = values;
    saveStore(store);
  }, [key, values]);

  const update = useCallback((patch) => {
    setValues((v) => {
      const next = { ...v, ...patch };
      if ("temperature" in patch) next.temperature = clamp(Number(next.temperature || 0), 0, 2);
      if ("topP" in patch)       next.topP       = clamp(Number(next.topP || 0), 0, 1);
      if ("maxTokens" in patch)  next.maxTokens  = clamp(parseInt(next.maxTokens || 1, 10), 1, 32000);
      return next;
    });
  }, []);

  const reset = useCallback(() => setValues(DEFAULTS), []);

  const toRequestParams = useCallback(() => {
    const p = {};
    if (values.useTemperature) p.temperature = values.temperature;
    if (values.useTopP)        p.top_p = values.topP;          // API 표기 맞춤
    if (values.useMaxTokens)   p.max_tokens = values.maxTokens;
    if (values.additionalOptions) {
      // 확장 포인트: stop, frequency_penalty, presence_penalty 등
    }
    if (values.apiKeyOverride?.trim()) {
      // 개발/테스트 한정. 서버에서 적절히 필터
      p.__api_key_override = values.apiKeyOverride.trim();
    }
    return p;
  }, [values]);

  const summary = useMemo(() => {
    const active = [];
    if (values.useTemperature) active.push(`temperature=${values.temperature}`);
    if (values.useTopP)        active.push(`top_p=${values.topP}`);
    if (values.useMaxTokens)   active.push(`max_tokens=${values.maxTokens}`);
    if (values.additionalOptions) active.push("additional=on");
    return active.join(", ");
  }, [values]);

  return { values, setValues, update, reset, toRequestParams, summary };
}
