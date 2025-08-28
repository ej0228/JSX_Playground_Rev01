// src/lib/langfuse.js

import { Langfuse } from "langfuse";

// ▼▼▼ 수정된 부분: export 키워드 추가 ▼▼▼
export const publicKey = import.meta.env.VITE_LANGFUSE_PUBLIC_KEY;
export const secretKey = import.meta.env.VITE_LANGFUSE_SECRET_KEY;
export const baseUrl = import.meta.env.VITE_LANGFUSE_BASE_URL;
// ---▲ 수정된 부분 ▲---

if (!publicKey || !secretKey || !baseUrl) {
  console.error("Langfuse environment variables are not set. Please check your .env file.");
}

export const langfuse = new Langfuse({
  publicKey,
  secretKey,
  baseUrl,
});