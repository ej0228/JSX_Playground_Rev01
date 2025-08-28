// src/Pages/Tracing/TraceTimelineApi.jsx
import { langfuse } from '../../lib/langfuse';

/**
 * 특정 Trace에 속한 Observation 목록을 가져옵니다.
 * @param {string} traceId - 조회할 Trace의 ID
 * @returns {Promise<Array<Object>>} UI에 표시될 Observation 목록
 */
export const fetchObservationsForTrace = async (traceId) => {
  if (!traceId) {
    throw new Error('Trace ID가 필요합니다.');
  }

  try {
    const response = await langfuse.api.observationsGetMany({
      traceId: traceId,
      limit: 100,
    });

    // API 응답에서 필요한 모든 데이터를 추출하여 반환
    return response.data.map(obs => ({
      id: obs.id,
      traceId: obs.traceId,
      parentObservationId: obs.parentObservationId,
      name: obs.name || obs.type,
      startTime: obs.startTime,
      endTime: obs.endTime,
      type: obs.type,
      model: obs.model,
      scores: obs.scores || [], // scores가 없으면 빈 배열로 초기화
    }));
  } catch (error) {
    console.error(`Failed to fetch observations for trace ${traceId}:`, error);
    throw new Error('Observation 목록을 불러오는 데 실패했습니다.');
  }
};