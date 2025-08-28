// src/Pages/Tracing/ObservationDetailApi.jsx
import { langfuse } from '../../lib/langfuse';

/**
 * 단일 Observation의 상세 정보를 ID 기반으로 가져옵니다.
 * @param {string} observationId - 조회할 Observation의 ID
 * @returns {Promise<Object>} Observation 상세 정보
 */
export const fetchObservationDetails = async (observationId) => {
  if (!observationId) {
    throw new Error('Observation ID가 필요합니다.');
  }

  try {
    // 단일 ID로 조회 시에는 observationId를 직접 인자로 전달합니다.
    const response = await langfuse.api.observationsGet(observationId);
    return response;
  } catch (error) {
    console.error(`Failed to fetch details for observation ${observationId}:`, error);
    throw new Error('Observation 상세 정보를 불러오는 데 실패했습니다.');
  }
};