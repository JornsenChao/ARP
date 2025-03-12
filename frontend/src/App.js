// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Tasks from './pages/Tasks';
import TaskDetails from './pages/TaskDetails';
import Resources from './pages/Resources';
import Precedents from './pages/Precedents';
import NotesOverview from './pages/NotesOverview';

import WorkflowHome from './pages/WorkflowHome';
import WorkflowStep from './pages/WorkflowStep';
import WorkflowTaskPage from './pages/WorkflowTaskPage';

import { WorkflowProvider } from './WorkflowContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#9c27b0',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WorkflowProvider>
        <Router>
          {/* 固定在顶部的 NavBar */}
          <NavBar />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/tasks/:taskId" element={<TaskDetails />} />
            <Route path="/notes" element={<NotesOverview />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/precedents" element={<Precedents />} />

            {/* 工作流路由 */}
            <Route path="/workflow" element={<WorkflowHome />} />
            <Route path="/workflow/step/:stepId" element={<WorkflowStep />} />
            <Route
              path="/workflow/step/:stepId/task/:taskId"
              element={<WorkflowTaskPage />}
            />
          </Routes>
        </Router>
      </WorkflowProvider>
    </ThemeProvider>
  );
}

export default App;
