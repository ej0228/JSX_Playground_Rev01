// src/components/Comments/Comments.jsx
import React, { useState } from 'react';
import styles from './Comments.module.css';
import { Trash2 } from 'lucide-react';

// 개별 댓글 컴포넌트
const Comment = ({ comment, onDelete }) => (
  <div className={styles.comment}>
    <div className={styles.commentHeader}>
      <div className={styles.headerLeft}>
        {/* 사용자 이니셜을 표시하는 원형 아이콘 */}
        <div className={styles.authorInitial}>
          {comment.author?.[0]?.toUpperCase() || '?'}
        </div>
        {/* 댓글 ID */}
        {/* <span className={styles.commentAuthor}>{comment.author}</span> */}
        {/* 마우스 호버 시에만 보이는 댓글 ID */}
        <span className={styles.commentId}>#{comment.id}</span>
      </div>
      <div className={styles.headerRight}>
        <span className={styles.commentTimestamp}>{comment.timestamp}</span>
        {/* 마우스 호버 시에만 보이는 삭제 버튼 */}
        <button className={styles.deleteButton} onClick={() => onDelete(comment.id)}>
          <Trash2 size={14} />
        </button>
      </div>
    </div>
    <div className={styles.commentBody}>
      <p>{comment.content}</p>
    </div>
  </div>
);

// 댓글 목록 및 입력 폼 컴포넌트
const Comments = ({
  comments,
  isLoading,
  error,
  onAddComment,
  onDeleteComment
}) => {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newComment.trim()) {
      const result = await onAddComment(newComment);
      if (result.success) {
        setNewComment(''); // 성공 시 입력창 비우기
      } else {
        alert(`댓글 추가 실패: ${result.error}`); // 실패 시 사용자에게 알림
      }
    }
  };

  const handleDelete = async (commentId) => {
      if (window.confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
          const result = await onDeleteComment(commentId);
          if (!result.success) {
              alert(`댓글 삭제 실패: ${result.error}`);
          }
      }
  }

  return (
    <div className={styles.commentsContainer}>
      <div className={styles.newCommentSection}>
        <form onSubmit={handleSubmit}>
          <textarea
            className={styles.commentTextarea}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add comment..."
          />
          <div className={styles.formActions}>
            <span className={styles.markdownSupport}>supports markdown</span>
            <button type="submit" className={styles.submitButton} disabled={!newComment.trim()}>
              Comment
            </button>
          </div>
        </form>
      </div>
      <div className={styles.commentsList}>
        {isLoading && <p>Loading comments...</p>}
        {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        {!isLoading && !error && comments.map((comment) => (
          <Comment key={comment.id} comment={comment} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
};

export default Comments;
