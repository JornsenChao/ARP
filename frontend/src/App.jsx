// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

import { WorkflowProvider } from './contexts/WorkflowContext';

import NavBar from './components/layout/NavBar';
import Home from './pages/Home';
import Resources from './pages/Resources';
import Precedents from './pages/Precedents';
import NotesOverview from './pages/NotesOverview';
import WorkflowHome from './pages/WorkflowHome';
import WorkflowStep from './pages/WorkflowStep';
import WorkflowTaskPage from './pages/WorkflowTaskPage';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <WorkflowProvider>
        <Router>
          <NavBar />
          {/* 
            If you want a left sidebar on every page, 
            you could place it here. Or each page 
            can have its own layout for the sidebar. 
          */}
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/precedents" element={<Precedents />} />
            <Route path="/notes" element={<NotesOverview />} />

            {/* Workflow routes */}
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
