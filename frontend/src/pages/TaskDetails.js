import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

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
    <div>
      <h1>Task Details</h1>
      {task ? (
        <div>
          <h2>{task.title}</h2>
          <p>{task.description}</p>
          <Link to="/tasks">Back to Tasks</Link>
        </div>
      ) : (
        <p>Loading task details...</p>
      )}
    </div>
  );
};

export default TaskDetails;
