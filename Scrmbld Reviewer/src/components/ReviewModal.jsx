import { useState, useEffect } from 'react';
import './ReviewModal.css';

function ReviewModal({ isOpen, onClose, track, userId, existingReview, onSave }) {
  const [content, setContent] = useState('');

  useEffect(() => {
    if (existingReview) {
      setContent(existingReview.content || '');
    } else {
      setContent('');
    }
  }, [existingReview, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (onSave && userId) {
      onSave(content);
    }
  };

  const handleClose = () => {
    setContent('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Review: {track?.name}</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>
        <div className="modal-body">
          <textarea
            className="review-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your review or notes about this track..."
            rows={10}
          />
        </div>
        <div className="modal-footer">
          <button className="cancel-button" onClick={handleClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Review
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewModal;

