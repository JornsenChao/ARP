import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Paper,
} from '@mui/material';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/tasks')
      .then((response) => response.json())
      .then((data) => setTasks(data))
      .catch((error) => console.error('Error fetching tasks:', error));
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        My Tasks
      </Typography>
      {tasks.length === 0 ? (
        <Typography>No tasks yet.</Typography>
      ) : (
        <Paper>
          <List>
            {tasks.map((task) => (
              <ListItemButton
                key={task.id}
                component={Link}
                to={`/tasks/${task.id}`}
              >
                <Link>{task.title}</Link>
                {/* <ListItemText primary={task.title} /> */}
              </ListItemButton>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default Tasks;
