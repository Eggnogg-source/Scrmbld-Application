import { useState, useEffect } from 'react';
import { trackNotesSync } from '../services/notesSync';
import './TrackNotes.css';

function TrackNotes({ trackId, userId }) {
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load note from Supabase (with localStorage fallback) on mount
  useEffect(() => {
    if (trackId && userId) {
      loadNote();
    }
  }, [trackId, userId]);

  const loadNote = async () => {
    if (!trackId || !userId) return;
    
    try {
      setLoading(true);
      const content = await trackNotesSync.get(trackId, userId);
      setNoteContent(content);
    } catch (error) {
      console.error('Error loading note:', error);
      // Fallback to localStorage only
      const storageKey = `track_note_${userId}_${trackId}`;
      const savedNote = localStorage.getItem(storageKey) || '';
      setNoteContent(savedNote);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!noteContent.trim() || !trackId || !userId) return;

    await trackNotesSync.save(trackId, userId, noteContent);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    await trackNotesSync.delete(trackId, userId);
    setNoteContent('');
    setIsEditing(false);
  };

  if (!userId) {
    return null;
  }

  const hasNote = noteContent.trim().length > 0;

  return (
    <div className="track-notes">
      <div className="notes-header">
        <h4>Notes</h4>
        {hasNote && !isEditing && (
          <button className="edit-note-button" onClick={() => setIsEditing(true)}>
            Edit
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading note...</div>
      ) : isEditing || !hasNote ? (
        <div className="note-editor">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Add your personal notes about this track..."
            rows={4}
            className="note-input"
          />
          <div className="note-actions">
            <button className="save-note-button" onClick={handleSave} disabled={!noteContent.trim()}>
              Save Note
            </button>
            {hasNote && (
              <button className="cancel-note-button" onClick={() => {
                setIsEditing(false);
                const storageKey = `track_note_${userId}_${trackId}`;
                const savedNote = localStorage.getItem(storageKey) || '';
                setNoteContent(savedNote);
              }}>
                Cancel
              </button>
            )}
            {hasNote && (
              <button className="delete-note-button" onClick={handleDelete}>
                Delete
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="note-display">
          <div className="note-content">{noteContent}</div>
        </div>
      )}
    </div>
  );
}

export default TrackNotes;
