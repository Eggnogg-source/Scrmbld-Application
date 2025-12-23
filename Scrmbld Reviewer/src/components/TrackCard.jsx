import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import { formatDuration } from '../services/spotifyApi';
import './TrackCard.css';

function TrackCard({ track, userId, onSync, onRatingChange }) {
  const [rating, setRating] = useState(0);
  const [hasNote, setHasNote] = useState(false);

  useEffect(() => {
    if (track?.id && userId) {
      loadTrackData();
    }
  }, [track?.id, userId]);

  const loadTrackData = () => {
    if (!track?.id || !userId) return;

    // Load rating from localStorage
    const ratingKey = `track_rating_${userId}_${track.id}`;
    const savedRating = localStorage.getItem(ratingKey);
    if (savedRating) {
      const ratingValue = parseInt(savedRating, 10);
      if (ratingValue >= 1 && ratingValue <= 5) {
        setRating(ratingValue);
      }
    }

    // Check for note in localStorage
    const noteKey = `track_note_${userId}_${track.id}`;
    const savedNote = localStorage.getItem(noteKey);
    setHasNote(!!savedNote && savedNote.trim().length > 0);
  };

  const handleRatingChange = (newRating) => {
    if (!track?.id || !userId) return;

    // Save to localStorage
    const ratingKey = `track_rating_${userId}_${track.id}`;
    localStorage.setItem(ratingKey, newRating.toString());
    setRating(newRating);
    
    // Trigger parent to recalculate album score
    if (onRatingChange) onRatingChange();
  };

  return (
    <div className="track-card">
      <div className="track-info">
        <div className="track-number">{track.track_number}</div>
        <div className="track-details">
          <div className="track-name">
            {track.name}
            {!rating && !hasNote && (
              <span className="untouched-indicator" title="No rating or notes yet">○</span>
            )}
          </div>
          <div className="track-duration">{formatDuration(track.duration_ms)}</div>
        </div>
      </div>
      
      <div className="track-actions">
        <div className="rating-section">
          <StarRating
            rating={rating}
            onRatingChange={handleRatingChange}
            readOnly={!userId}
          />
        </div>
      </div>
    </div>
  );
}

export default TrackCard;
