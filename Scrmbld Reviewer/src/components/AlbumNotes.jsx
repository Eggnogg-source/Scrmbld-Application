import { useState, useEffect } from 'react';
import { albumNotesSync } from '../services/notesSync';
import './AlbumNotes.css';

function AlbumNotes({ albumId, userId, onNoteChange }) {
  const [noteContent, setNoteContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load note from Supabase (with localStorage fallback) on mount
  useEffect(() => {
    if (albumId && userId) {
      loadNote();
    }
  }, [albumId, userId]);

  const loadNote = async () => {
    if (!albumId || !userId) return;
    
    try {
      setLoading(true);
      const content = await albumNotesSync.get(albumId, userId);
      setNoteContent(content);
    } catch (error) {
      console.error('Error loading album note:', error);
      // Fallback to localStorage only
      const storageKey = `album_note_${userId}_${albumId}`;
      const savedNote = localStorage.getItem(storageKey) || '';
      setNoteContent(savedNote);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!noteContent.trim() || !albumId || !userId) return;

    await albumNotesSync.save(albumId, userId, noteContent);
    setIsEditing(false);
    if (onNoteChange) onNoteChange();
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this note?')) {
      return;
    }

    await albumNotesSync.delete(albumId, userId);
    setNoteContent('');
    setIsEditing(false);
    if (onNoteChange) onNoteChange();
  };

  if (!userId) {
    return null;
  }

  const hasNote = noteContent.trim().length > 0;

  return (
    <div className="album-notes">
      <div className="album-notes-header">
        <h2>Album Notes</h2>
        <div className="album-notes-actions">
          {hasNote && !isEditing && (
            <button className="edit-note-button" onClick={() => setIsEditing(true)}>
              Edit
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading note...</div>
      ) : isEditing || !hasNote ? (
        <div className="note-editor">
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="Add your personal notes about this album..."
            rows={6}
            className="note-input"
          />
          <div className="note-actions">
            <button className="save-note-button" onClick={handleSave} disabled={!noteContent.trim()}>
              Save Note
            </button>
            {hasNote && (
              <button className="cancel-note-button" onClick={() => {
                setIsEditing(false);
                const storageKey = `album_note_${userId}_${albumId}`;
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

export default AlbumNotes;
