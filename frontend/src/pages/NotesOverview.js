// src/pages/NotesOverview.js
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Paper,
} from '@mui/material';

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
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        All Notes
      </Typography>

      {notes.length === 0 ? (
        <Typography>No notes yet.</Typography>
      ) : (
        <Paper sx={{ p: 2 }}>
          <List>
            {notes.map((n) => (
              <ListItem
                key={n.id}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                }}
              >
                <ListItemText
                  primary={`[Step ${n.stepId}, Task ${n.taskId ?? 'N/A'}]`}
                  secondary={n.content}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleDelete(n.id)}
                  sx={{ mt: 1 }}
                >
                  Delete
                </Button>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default NotesOverview;
