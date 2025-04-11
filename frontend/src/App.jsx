// src/App.jsx

import React, { useState } from 'react';
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
import Step2AssessRisk from './pages/essentialWorkflow/Step2AssessRisk';
import Step3ParallelTasks from './pages/essentialWorkflow/Step3ParallelTasks';
import Step4Summary from './pages/essentialWorkflow/Step4Summary';
const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
});

// 临时：示例项目ID（多项目管理时可让用户选择）
const DEMO_PROJECT_ID = 'demoProject123';

function App() {
  // 如果要切换项目，可在这里管理
  const [projectId] = useState(DEMO_PROJECT_ID);
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RefWorkflowProvider>
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
                <EssentialWorkflowProvider projectId={projectId}>
                  <EssentialWorkflowHome />
                </EssentialWorkflowProvider>
              }
            />
            <Route
              path="/workflow/step1"
              element={
                <EssentialWorkflowProvider projectId={projectId}>
                  <Step1IdentifyHazard />
                </EssentialWorkflowProvider>
              }
            />
            <Route
              path="/workflow/step2"
              element={
                <EssentialWorkflowProvider projectId={projectId}>
                  <Step2AssessRisk />
                </EssentialWorkflowProvider>
              }
            />
            <Route
              path="/workflow/step3"
              element={
                <EssentialWorkflowProvider projectId={projectId}>
                  <Step3ParallelTasks />
                </EssentialWorkflowProvider>
              }
            />
            <Route
              path="/workflow/step4"
              element={
                <EssentialWorkflowProvider projectId={projectId}>
                  <Step4Summary />
                </EssentialWorkflowProvider>
              }
            />
          </Routes>
        </Router>
      </RefWorkflowProvider>
    </ThemeProvider>
  );
}

export default App;
