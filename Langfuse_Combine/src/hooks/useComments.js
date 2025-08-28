// src/hooks/useComments.js
import { useState, useEffect, useCallback } from 'react';
import { fetchComments, createComment, deleteComment } from 'api/components/commentsApi';

/**
 * 댓글 관련 로직을 관리하는 커스텀 훅
 * @param {string} projectId - 댓글이 속한 프로젝트의 ID
 * @param {'TRACE' | 'OBSERVATION'} objectType
 * @param {string} objectId
 */
export const useComments = (projectId, objectType, objectId) => {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadComments = useCallback(async () => {
    if (!objectId) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetchedComments = await fetchComments({ objectType, objectId });
      setComments(fetchedComments);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [objectType, objectId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // 댓글 추가 함수
  const addComment = async (content) => {
    if (!objectId || !projectId) return { success: false, error: 'ID is missing.' };
    try {
      // [수정] projectId를 createComment 함수로 전달
      await createComment({ projectId, objectType, objectId, content });
      await loadComments();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // 댓글 삭제 함수
  const removeComment = async (commentId) => {
    if (!objectId) return { success: false, error: 'Object ID is missing.' };
    try {
      await deleteComment({ commentId });
      await loadComments();
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  return { comments, isLoading, error, addComment, removeComment };
};
