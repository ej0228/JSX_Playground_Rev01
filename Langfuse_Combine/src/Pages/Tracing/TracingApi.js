// src/pages/Tracing/TracingApi.js
import { langfuse } from '../../lib/langfuse';

/**
 * API 응답 값을 UI에 표시하기 안전한 문자열로 변환합니다.
 * @param {*} value 변환할 값
 * @returns {string}
 */
const formatTraceValue = (value) => {
    if (value === null || typeof value === 'undefined') {
        return 'N/A';
    }
    if (typeof value === 'string') {
        return value;
    }
    return JSON.stringify(value, null, 2);
}

/**
 * Langfuse API에서 트레이스 목록을 가져옵니다.
 * @returns {Promise<Array<Object>>}
 */
export const fetchTraces = async () => {
  try {
    const response = await langfuse.api.traceList({});
    const apiResponse = response;

    return apiResponse.data.map(trace => ({
      id: trace.id,
      timestamp: new Date(trace.timestamp).toLocaleString(),
      name: trace.name ?? 'N/A',
      input: formatTraceValue(trace.input),
      output: formatTraceValue(trace.output),
      sessionId: trace.sessionId ?? 'N/A',
      userId: trace.userId ?? 'N/A',
      release: trace.release ?? 'N/A',
      version: trace.version ?? 'N/A',
      tags: trace.tags ?? [],
      isFavorited: false,
      observations: Array.isArray(trace.observations) ? trace.observations.length : 0, // observation 개수 반영
      env: trace.environment ?? 'default',
      latency: trace.latency ?? 0,
      cost: trace.totalCost ?? 0, // totalCost 필드 사용
      public: trace.public,
      metadata: trace.metadata,
      environment: trace.environment
    }));
  } catch (error) {
    console.error("Failed to fetch traces:", error);
    throw new Error('트레이스 목록을 불러오는 데 실패했습니다.');
  }
};

/**
 * ID를 기반으로 트레이스를 삭제합니다.
 * @param {string} traceId - 삭제할 트레이스의 ID
 */
export const deleteTrace = async (traceId) => {
  try {
    await langfuse.api.traceDelete(traceId);
  } catch (error) {
    console.error(`Failed to delete trace ${traceId}:`, error);
    throw new Error('Trace 삭제에 실패했습니다.');
  }
};