// src/pages/Tracing/Sessions/SessionDetailApi.js
import { langfuse } from 'lib/langfuse';

// API 응답값을 UI에 표시하기 안전한 문자열로 변환
const formatTraceValue = (value) => {
    if (value === null || typeof value === 'undefined') {
        return 'N/A';
    }
    if (typeof value === 'string') {
        return value;
    }
    // 객체인 경우, 보기 좋게 2칸 들여쓰기된 JSON 문자열로 변환
    return JSON.stringify(value, null, 2);
};

// API 응답을 UI에서 사용할 데이터 형태로 변환
const transformDataForUi = (apiData) => {
  // 스키마에 따라 모든 trace 필드를 추출
  const uiTraces = apiData.traces.map(trace => {
    const outputString = formatTraceValue(trace.output);
    const hasError = typeof trace.metadata === 'object' && trace.metadata !== null && 'error' in trace.metadata && trace.metadata.error === true;
    const summary = trace.name || outputString.substring(0, 100) + (outputString.length > 100 ? '...' : '');

    return {
      // Trace의 모든 필드를 UI 모델에 매핑
      id: trace.id,
      timestamp: new Date(trace.timestamp),
      name: trace.name,
      input: trace.input ?? {},
      output: outputString,
      sessionId: trace.sessionId,
      release: trace.release,
      version: trace.version,
      userId: trace.userId,
      metadata: trace.metadata,
      tags: trace.tags || [],
      public: trace.public,
      environment: trace.environment,
      // 기존 UI 로직 유지
      status: hasError ? 'negative' : 'positive',
      summary: summary,
      scores: [], // score는 session detail api에 없으므로 빈 배열로 초기화
    };
  });

  // Session의 모든 필드를 UI 모델에 매핑
  return {
    id: apiData.id,
    createdAt: new Date(apiData.createdAt),
    projectId: apiData.projectId,
    environment: apiData.environment,
    traces: uiTraces,
  };
};

export const fetchSessionDetails = async (sessionId) => {
    try {
        const response = await langfuse.api.sessionsGet(sessionId);
        const apiData = response;
        return transformDataForUi(apiData);
    } catch (error) {
        console.error(`Failed to fetch details for session ${sessionId}:`, error);
        throw new Error('세션 상세 정보를 불러오는 데 실패했습니다.');
    }
};