import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { Box, Toolbar } from '@mui/material';

// Import your WorkflowContext so we can get the workflow data
import { WorkflowContext } from '../contexts/WorkflowContext';

// Import the old CSS you used for the horizontal scroller
import './WorkflowHome.css';

function WorkflowHome() {
  // Access workflow array from context
  const { workflow } = useContext(WorkflowContext);

  return (
    // We wrap everything in a Box so that we can offset the NavBar (fixed at top)
    <Box sx={{ mt: 8 /* ensures content starts below the top AppBar */ }}>
      <Toolbar />
      {/* 
        The code below uses your original horizontal scroller layout:
        - .workflow-fullscreen as the container
        - .steps-scroller with .steps-line to draw a horizontal line
        - .step-card for each step
      */}
      <div className="workflow-fullscreen">
        <div className="steps-scroller">
          <div className="steps-line" />
          {workflow.map((step) => (
            <div key={step.id} className="step-card">
              <h4>Step {step.id}</h4>
              {/* Link to the detailed step page */}
              <Link to={`/workflow/step/${step.id}`} className="step-card-link">
                <h2>{step.stepTitle}</h2>
              </Link>

              <ul>
                {step.tasks.map((task) => (
                  <li key={task.id}>
                    <strong>{task.title}</strong> <br />
                    {task.detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </Box>
  );
}

export default WorkflowHome;
