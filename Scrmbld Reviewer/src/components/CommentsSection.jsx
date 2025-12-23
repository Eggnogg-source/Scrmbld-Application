import { useState, useEffect } from 'react';
import { commentsApi } from '../services/api';
import './CommentsSection.css';

function CommentsSection({ trackId, userId }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadComments();
  }, [trackId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const data = await commentsApi.getTrackComments(trackId);
      setComments(data);
      setError(null);
    } catch (err) {
      setError('Failed to load comments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !userId) return;

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CommentsSection.jsx:31',message:'Comment create attempt',data:{trackId:trackId,userId:userId},timestamp:Date.now(),sessionId:'debug-session',runId:'rating-fix',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
      const comment = await commentsApi.createComment(trackId, userId, newComment);
      setComments([comment, ...comments]);
      setNewComment('');
      setError(null);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e969b3c1-901c-484b-8b79-d34d8d6b91a2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CommentsSection.jsx:38',message:'Comment create error',data:{error:err.message,errorResponse:err.response?.data},timestamp:Date.now(),sessionId:'debug-session',runId:'rating-fix',hypothesisId:'O'})}).catch(()=>{});
      // #endregion
      setError('Failed to add comment');
      console.error(err);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await commentsApi.deleteComment(commentId, userId);
      setComments(comments.filter(c => c.id !== commentId));
      setError(null);
    } catch (err) {
      setError('Failed to delete comment');
      console.error(err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="comments-section">
      <h3>Comments</h3>
      
      {error && <div className="error-message">{error}</div>}

      {userId && (
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="comment-input"
          />
          <button type="submit" className="submit-button" disabled={!newComment.trim()}>
            Post Comment
          </button>
        </form>
      )}

      {loading ? (
        <div className="loading">Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className="no-comments">No comments yet. Be the first to comment!</div>
      ) : (
        <div className="comments-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{comment.display_name || 'Anonymous'}</span>
                <span className="comment-date">{formatDate(comment.created_at)}</span>
                {userId && comment.user_id === userId && (
                  <button
                    className="delete-comment-button"
                    onClick={() => handleDelete(comment.id)}
                  >
                    Delete
                  </button>
                )}
              </div>
              <div className="comment-content">{comment.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CommentsSection;

