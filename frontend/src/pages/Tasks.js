import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/tasks')
      .then((response) => response.json())
      .then((data) => setTasks(data))
      .catch((error) => console.error('Error fetching tasks:', error));
  }, []);

  return (
    <div>
      <h1>MyTasks</h1>
      {tasks.length === 0 ? (
        <p>Loading your tasks...</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li key={task.id}>
              <Link to={`/tasks/${task.id}`}>{task.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Tasks;
