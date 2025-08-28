// src/pages/Tracing/Sessions/SessionApi.js
import { langfuse } from 'lib/langfuse';

/**
 * Langfuse API에서 세션 목록을 가져옵니다.
 */
export const fetchSessions = async () => {
  try {
    const response = await langfuse.api.sessionsList({});
    const apiResponse = response;

    // API 스키마에 맞춰 UI에서 사용할 데이터 형태로 변환합니다.
    return apiResponse.data.map((session) => ({
      id: session.id,
      createdAt: new Date(session.createdAt).toLocaleString(),
      projectId: session.projectId,
      environment: session.environment ?? 'default', // null일 경우 'default'로 표시
    }));
  } catch (error)
   {
    console.error("Failed to fetch sessions:", error);
    throw new Error('세션 목록을 불러오는 데 실패했습니다.');
  }
};