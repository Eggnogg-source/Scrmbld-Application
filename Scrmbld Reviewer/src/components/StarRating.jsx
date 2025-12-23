import { useState, useEffect } from 'react';
import './StarRating.css';

function StarRating({ rating = 0, onRatingChange, readOnly = false }) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const handleClick = (value) => {
    if (!readOnly && onRatingChange) {
      onRatingChange(value);
    }
  };

  const handleMouseEnter = (value) => {
    if (!readOnly) {
      setHoveredRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (!readOnly) {
      setHoveredRating(0);
    }
  };

  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((value) => {
        const isFilled = value <= (hoveredRating || rating);
        return (
          <span
            key={value}
            className={`star ${isFilled ? 'filled' : 'empty'} ${readOnly ? 'read-only' : 'clickable'}`}
            onClick={() => handleClick(value)}
            onMouseEnter={() => handleMouseEnter(value)}
            onMouseLeave={handleMouseLeave}
            role="button"
            tabIndex={readOnly ? -1 : 0}
            aria-label={`Rate ${value} out of 5 stars`}
          >
            ★
          </span>
        );
      })}
    </div>
  );
}

export default StarRating;

