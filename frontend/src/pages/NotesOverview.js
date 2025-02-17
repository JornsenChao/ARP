// src/pages/NotesOverview.js
import React, { useEffect, useState } from 'react';

const NotesOverview = () => {
  const [notes, setNotes] = useState([]);

  const fetchNotes = async () => {
    try {
      const res = await fetch('http://localhost:8000/notes');
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleDelete = async (noteId) => {
    try {
      await fetch(`http://localhost:8000/notes/${noteId}`, {
        method: 'DELETE',
      });
      // 删除成功后重新获取
      fetchNotes();
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  return (
    <div>
      <h1>All Notes</h1>
      {notes.length === 0 ? (
        <p>No notes yet.</p>
      ) : (
        <ul>
          {notes.map((n) => (
            <li key={n.id}>
              <p>
                [Step {n.stepId}, Task {n.taskId ?? 'N/A'}] - {n.content}
              </p>
              <button onClick={() => handleDelete(n.id)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotesOverview;
