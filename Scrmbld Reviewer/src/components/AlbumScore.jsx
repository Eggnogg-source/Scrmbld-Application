import { useState, useEffect } from 'react';
import './AlbumScore.css';

function AlbumScore({ albumId, tracks, userId, refreshTrigger }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (tracks.length > 0 && userId) {
      calculateScore();
    } else {
      setLoading(false);
    }
  }, [tracks, userId, refreshTrigger]);

  const calculateScore = () => {
    if (!userId) {
      setScore(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    let totalStars = 0;
    let ratedTracks = 0;

    // Get ratings from localStorage for all tracks
    tracks.forEach((track) => {
      const ratingKey = `track_rating_${userId}_${track.id}`;
      const savedRating = localStorage.getItem(ratingKey);
      if (savedRating) {
        const ratingValue = parseInt(savedRating, 10);
        if (ratingValue >= 1 && ratingValue <= 5) {
          totalStars += ratingValue;
          ratedTracks++;
        }
      }
    });

    if (ratedTracks === 0) {
      setScore(null);
    } else {
      // Calculate average and convert to 0-10 scale
      const averageRating = totalStars / ratedTracks;
      const scoreOutOf10 = (averageRating / 5) * 10;
      setScore({
        score: scoreOutOf10,
        ratedTracks,
        totalTracks: tracks.length,
      });
    }
    setLoading(false);
  };

  const getGrade = (scoreOutOf10) => {
    if (scoreOutOf10 >= 9.5) return 'A+';
    if (scoreOutOf10 >= 9.0) return 'A';
    if (scoreOutOf10 >= 8.5) return 'A-';
    if (scoreOutOf10 >= 8.0) return 'B+';
    if (scoreOutOf10 >= 7.5) return 'B';
    if (scoreOutOf10 >= 7.0) return 'B-';
    if (scoreOutOf10 >= 6.5) return 'C+';
    if (scoreOutOf10 >= 6.0) return 'C';
    if (scoreOutOf10 >= 5.5) return 'C-';
    if (scoreOutOf10 >= 5.0) return 'D+';
    if (scoreOutOf10 >= 4.5) return 'D';
    if (scoreOutOf10 >= 4.0) return 'D-';
    return 'F';
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#1db954';
    if (grade.startsWith('B')) return '#1ed760';
    if (grade.startsWith('C')) return '#ffa500';
    if (grade.startsWith('D')) return '#ff6b6b';
    return '#c33';
  };

  if (loading) {
    return <div className="album-score-loading">Calculating score...</div>;
  }

  if (!score) {
    return (
      <div className="album-score">
        <div className="score-label">Album Score</div>
        <div className="score-value no-score">Start Rating Some Tracks!</div>
      </div>
    );
  }

  const grade = getGrade(score.score);
  const gradeColor = getGradeColor(grade);

  return (
    <div className="album-score">
      <div className="score-label">Album Score</div>
      <div className="score-display">
        <div className="score-value" style={{ color: gradeColor }}>
          {score.score.toFixed(1)}/10
        </div>
        <div className="score-grade" style={{ color: gradeColor }}>
          {grade}
        </div>
      </div>
      <div className="score-info">
        {score.ratedTracks} of {score.totalTracks} tracks rated
      </div>
    </div>
  );
}

export default AlbumScore;
