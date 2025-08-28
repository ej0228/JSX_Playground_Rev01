// src/api/commentsApi.js
import { langfuse } from 'lib/langfuse';

/**
 * 특정 객체(Trace, Observation 등)에 대한 댓글 목록을 가져옵니다.
 * @param {object} params
 * @param {'TRACE' | 'OBSERVATION' | 'SESSION' | 'PROMPT'} params.objectType - 댓글이 달린 객체의 타입
 * @param {string} params.objectId - 댓글이 달린 객체의 ID
 * @returns {Promise<Array<object>>} UI에서 사용할 형태로 가공된 댓글 목록
 */
export const fetchComments = async ({ objectType, objectId }) => {
  try {
    const response = await langfuse.api.commentsGet({ objectType, objectId });

    // API 응답을 UI에서 사용하기 좋은 형태로 가공
    return response.data.map(comment => ({
      id: comment.id,
      author: comment.authorUserId || 'Unknown User',
      timestamp: new Date(comment.createdAt).toLocaleString(),
      content: comment.content,
    }));
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    throw new Error('댓글을 불러오는 데 실패했습니다.');
  }
};

/**
 * 새로운 댓글을 생성합니다.
 * @param {object} params
 * @param {string} params.projectId - 댓글이 속한 프로젝트의 ID
 * @param {'TRACE' | 'OBSERVATION'} params.objectType
 * @param {string} params.objectId
 * @param {string} params.content - 댓글 내용
 * @returns {Promise<object>} 생성된 댓글 객체
 */
export const createComment = async ({ projectId, objectType, objectId, content }) => {
    try {
        // [수정] langfuse.api.commentCreate -> langfuse.api.commentsCreate로 변경하고 projectId 추가
        const response = await langfuse.api.commentsCreate({
            projectId, // 필수 파라미터 추가
            objectType,
            objectId,
            content,
        });
        return response;
    } catch (error) {
        console.error("Failed to create comment:", error);
        throw new Error('댓글을 작성하는 데 실패했습니다.');
    }
}

/**
 * 댓글을 삭제합니다.
 * @param {object} params
 * @param {string} params.commentId - 삭제할 댓글의 ID
 * @returns {Promise<void>}
 */
export const deleteComment = async ({ commentId }) => {
    try {
        // [수정] langfuse.api.commentDelete -> langfuse.comments.delete
        await langfuse.comments.delete({ commentId });
    } catch (error) {
        console.error("Failed to delete comment:", error);
        throw new Error('댓글을 삭제하는 데 실패했습니다.');
    }
};
