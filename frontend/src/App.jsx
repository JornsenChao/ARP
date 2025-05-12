// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
// Context
import { EssentialWorkflowProvider } from './contexts/EssentialWorkflowContext';
import { RefWorkflowProvider } from './contexts/RefWorkflowContext';

import NavBar from './components/layout/NavBar';
import Home from './pages/Home';
import Resources from './pages/Resources';
import Precedents from './pages/Precedents';
import NotesOverview from './pages/NotesOverview';

import RefWorkflowHome from './pages/refWorkflow/RefWorkflowHome';
import RefWorkflowStep from './pages/refWorkflow/RefWorkflowStep';
import RefWorkflowTaskPage from './pages/refWorkflow/RefWorkflowTaskPage';

// Essential Workflow pages
import EssentialWorkflowHome from './pages/essentialWorkflow/EssentialWorkflowHome';
import Step1IdentifyHazard from './pages/essentialWorkflow/Step1IdentifyHazard';
import Step2AssessRisk from './pages/essentialWorkflow/step2/Step2AssessRisk';
import Step3ParallelTasks from './pages/essentialWorkflow/Step3ParallelTasks';
import Step4Summary from './pages/essentialWorkflow/Step4Summary';
import FileManagement from './pages/FileManagement';

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
      <RefWorkflowProvider>
        <Router>
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />} />
            {/* <Route path="/resources" element={<Resources />} /> */}
            {/* <Route path="/precedents" element={<Precedents />} /> */}
            {/* <Route path="/notes" element={<NotesOverview />} /> */}

            {/* Reference Workflow routes */}
            <Route path="/ref-workflow" element={<RefWorkflowHome />} />
            <Route
              path="/ref-workflow/step/:stepId"
              element={<RefWorkflowStep />}
            />
            <Route
              path="/ref-workflow/step/:stepId/task/:taskId"
              element={<RefWorkflowTaskPage />}
            />

            {/* Essential Workflow */}
            <Route
              path="/workflow"
              element={
                <EssentialWorkflowProvider>
                  <EssentialWorkflowHome />
                </EssentialWorkflowProvider>
              }
            />
            <Route
              path="/workflow/step1"
              element={
                <EssentialWorkflowProvider>
                  <Step1IdentifyHazard />
                </EssentialWorkflowProvider>
              }
            />
            <Route
              path="/workflow/step2"
              element={
                <EssentialWorkflowProvider>
                  <Step2AssessRisk />
                </EssentialWorkflowProvider>
              }
            />
            <Route
              path="/workflow/step3"
              element={
                <EssentialWorkflowProvider>
                  <Step3ParallelTasks />
                </EssentialWorkflowProvider>
              }
            />
            <Route
              path="/workflow/step4"
              element={
                <EssentialWorkflowProvider>
                  <Step4Summary />
                </EssentialWorkflowProvider>
              }
            />
            {/* New RAG-based File Management */}
            <Route path="/files" element={<FileManagement />} />
            {/* 如果想直接暴露 MultiRAG / ProRAG, 可加: */}
            {/* <Route path="/multirag" element={<MultiRAG />} />
            <Route path="/prorag" element={<ProRAG />} /> */}
          </Routes>
        </Router>
      </RefWorkflowProvider>
    </ThemeProvider>
  );
}

export default App;
