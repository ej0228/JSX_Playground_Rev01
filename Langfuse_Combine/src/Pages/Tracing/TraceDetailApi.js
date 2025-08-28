// src/pages/Tracing/TraceDetailApi.js
import { langfuse } from '../../lib/langfuse';

/**
 * ID를 기반으로 단일 트레이스의 상세 정보를 가져옵니다.
 * @param {string} traceId - 조회할 트레이스의 ID
 */
export const fetchTraceDetails = async (traceId) => {
    try {
        // 오류 수정: { traceId } -> traceId
        const response = await langfuse.api.traceGet(traceId);
        // API 응답을 그대로 반환합니다.
        return response;
    } catch (error) {
        console.error(`Failed to fetch details for trace ${traceId}:`, error);
        // 사용자에게 더 친절한 에러 메시지를 반환할 수 있습니다.
        throw new Error('트레이스 상세 정보를 불러오는 데 실패했습니다.');
    }
};