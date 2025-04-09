// src/pages/TaskDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Box, Typography, Button, Paper } from '@mui/material';

const TaskDetails = () => {
  const { taskId } = useParams();
  const [task, setTask] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:8000/tasks/${taskId}`)
      .then((response) => response.json())
      .then((data) => setTask(data))
      .catch((error) => console.error('Error fetching task details:', error));
  }, [taskId]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Task Details
      </Typography>
      {task ? (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h5">{task.title}</Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {task.description}
          </Typography>
          <Button component={Link} to="/tasks" variant="outlined">
            Back to Tasks
          </Button>
        </Paper>
      ) : (
        <Typography>Loading task details...</Typography>
      )}
    </Box>
  );
};

export default TaskDetails;
